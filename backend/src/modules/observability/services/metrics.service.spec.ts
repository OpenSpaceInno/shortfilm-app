import { MetricsService } from './metrics.service';
import { METRIC_NAMES } from '../constants/observability.constants';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
    service.onModuleInit();
  });

  afterEach(() => {
    service.resetMetrics();
  });

  it('should initialize all required Golden Signal metrics', async () => {
    const rawMetrics = await service.getMetrics();
    expect(rawMetrics).toContain(METRIC_NAMES.HTTP_REQUEST_DURATION_SECONDS);
    expect(rawMetrics).toContain(METRIC_NAMES.HTTP_REQUESTS_TOTAL);
    expect(rawMetrics).toContain(METRIC_NAMES.INTERACTIVE_CHOICE_RESOLUTION_DURATION_MS);
    expect(rawMetrics).toContain(METRIC_NAMES.BULLMQ_QUEUE_WAITING_JOBS);
    expect(rawMetrics).toContain(METRIC_NAMES.BULLMQ_QUEUE_FAILED_JOBS_TOTAL);
    expect(rawMetrics).toContain(METRIC_NAMES.DB_POOL_ACTIVE_CONNECTIONS);
    expect(rawMetrics).toContain(METRIC_NAMES.REDIS_CONNECTED_CLIENTS);
    expect(rawMetrics).toContain(METRIC_NAMES.CLOUDFLARE_STREAM_WEBHOOK_FAILURES_TOTAL);
  });

  it('should record HTTP request duration and increment request counter', async () => {
    service.recordHttpRequest('GET', '/api/v1/stories', 200, 0.045);

    const metricsOutput = await service.getMetrics();
    expect(metricsOutput).toContain('http_requests_total{method="GET",route="/api/v1/stories",status_code="200"} 1');
    expect(metricsOutput).toContain('http_request_duration_seconds_count{method="GET",route="/api/v1/stories",status_code="200"} 1');
  });

  it('should record interactive choice resolution latency', async () => {
    service.recordChoiceResolution(18.5, 'sty_123', 'success');

    const metricsOutput = await service.getMetrics();
    expect(metricsOutput).toContain('interactive_choice_resolution_duration_ms_count{story_id="sty_123",status="success"} 1');
  });

  it('should track BullMQ queue gauges and failure counters', async () => {
    service.setBullmqWaitingJobs('video-processing', 12);
    service.incrementBullmqFailedJobs('video-processing', 2);

    const metricsOutput = await service.getMetrics();
    expect(metricsOutput).toContain('bullmq_queue_waiting_jobs{queue_name="video-processing"} 12');
    expect(metricsOutput).toContain('bullmq_queue_failed_jobs_total{queue_name="video-processing"} 2');
  });

  it('should set active connections and provide metrics summary', async () => {
    service.setDbPoolActiveConnections(8);
    service.setRedisConnectedClients(5);

    const summary = await service.getMetricsSummary();
    expect(summary.dbConnections).toBe(8);
    expect(summary.redisClients).toBe(5);
    expect(summary.uptimeSeconds).toBeGreaterThan(0);
  });

  it('should return valid Prometheus Content-Type', () => {
    expect(service.getContentType()).toContain('text/plain');
  });
});

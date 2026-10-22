import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Histogram,
  Counter,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';
import {
  METRIC_NAMES,
  DEFAULT_HTTP_DURATION_BUCKETS,
  DEFAULT_CHOICE_DURATION_BUCKETS,
} from '../constants/observability.constants';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  // Prometheus Metrics definitions
  public readonly httpRequestDurationSeconds: Histogram<string>;
  public readonly httpRequestsTotal: Counter<string>;
  public readonly interactiveChoiceResolutionDurationMs: Histogram<string>;
  public readonly bullmqQueueWaitingJobs: Gauge<string>;
  public readonly bullmqQueueFailedJobsTotal: Counter<string>;
  public readonly dbPoolActiveConnections: Gauge<string>;
  public readonly redisConnectedClients: Gauge<string>;
  public readonly cloudflareStreamWebhookFailuresTotal: Counter<string>;

  constructor() {
    this.registry = new Registry();

    // 1. HTTP Request Latency Histogram
    this.httpRequestDurationSeconds = new Histogram({
      name: METRIC_NAMES.HTTP_REQUEST_DURATION_SECONDS,
      help: 'Request latency in seconds bucketed by method, route, and status code (Alert: p95 > 250ms)',
      labelNames: ['method', 'route', 'status_code'],
      buckets: DEFAULT_HTTP_DURATION_BUCKETS,
      registers: [this.registry],
    });

    // 2. HTTP Requests Total Counter
    this.httpRequestsTotal = new Counter({
      name: METRIC_NAMES.HTTP_REQUESTS_TOTAL,
      help: 'Total request throughput segmented by method, route, and status code (Alert: 5xx rate > 1.5%)',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // 3. Interactive Choice Resolution Duration Histogram
    this.interactiveChoiceResolutionDurationMs = new Histogram({
      name: METRIC_NAMES.INTERACTIVE_CHOICE_RESOLUTION_DURATION_MS,
      help: 'Latency of graph choice resolution transaction in milliseconds (Alert: p95 > 60ms)',
      labelNames: ['story_id', 'status'],
      buckets: DEFAULT_CHOICE_DURATION_BUCKETS,
      registers: [this.registry],
    });

    // 4. BullMQ Queue Waiting Jobs Gauge
    this.bullmqQueueWaitingJobs = new Gauge({
      name: METRIC_NAMES.BULLMQ_QUEUE_WAITING_JOBS,
      help: 'Number of jobs waiting in BullMQ queues (Alert: video-processing backlog > 50)',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    // 5. BullMQ Failed Jobs Counter
    this.bullmqQueueFailedJobsTotal = new Counter({
      name: METRIC_NAMES.BULLMQ_QUEUE_FAILED_JOBS_TOTAL,
      help: 'Cumulative job failures in BullMQ queues',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    // 6. DB Pool Active Connections Gauge
    this.dbPoolActiveConnections = new Gauge({
      name: METRIC_NAMES.DB_POOL_ACTIVE_CONNECTIONS,
      help: 'Active MySQL connection pool utilization count (Alert: pool usage > 85%)',
      registers: [this.registry],
    });

    // 7. Redis Connected Clients Gauge
    this.redisConnectedClients = new Gauge({
      name: METRIC_NAMES.REDIS_CONNECTED_CLIENTS,
      help: 'Active Redis client connections count',
      registers: [this.registry],
    });

    // 8. Cloudflare Stream Webhook Failures Counter
    this.cloudflareStreamWebhookFailuresTotal = new Counter({
      name: METRIC_NAMES.CLOUDFLARE_STREAM_WEBHOOK_FAILURES_TOTAL,
      help: 'Video transcoding failures reported by Cloudflare Stream webhooks',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    // Collect standard Node.js / process runtime metrics
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'shortreel_',
    });
  }

  /**
   * Retrieves the raw Prometheus text exposition formatted string.
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Returns standard Prometheus content-type header string.
   */
  getContentType(): string {
    return this.registry.contentType;
  }

  /**
   * Records an HTTP request duration and increments the counter.
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      method: method.toUpperCase(),
      route: route || 'unknown',
      status_code: String(statusCode),
    };

    this.httpRequestDurationSeconds.observe(labels, durationSeconds);
    this.httpRequestsTotal.inc(labels);
  }

  /**
   * Records interactive choice resolution transaction latency.
   */
  recordChoiceResolution(
    durationMs: number,
    storyId = 'unknown',
    status = 'success',
  ): void {
    this.interactiveChoiceResolutionDurationMs.observe(
      { story_id: storyId, status },
      durationMs,
    );
  }

  /**
   * Sets the current waiting job backlog for a specific queue.
   */
  setBullmqWaitingJobs(queueName: string, count: number): void {
    this.bullmqQueueWaitingJobs.set({ queue_name: queueName }, count);
  }

  /**
   * Increments the failure count for a queue.
   */
  incrementBullmqFailedJobs(queueName: string, count = 1): void {
    this.bullmqQueueFailedJobsTotal.inc({ queue_name: queueName }, count);
  }

  /**
   * Updates current MySQL active connections metric.
   */
  setDbPoolActiveConnections(count: number): void {
    this.dbPoolActiveConnections.set(count);
  }

  /**
   * Updates current Redis connected clients metric.
   */
  setRedisConnectedClients(count: number): void {
    this.redisConnectedClients.set(count);
  }

  /**
   * Increments Cloudflare Stream webhook failures.
   */
  incrementCloudflareWebhookFailures(count = 1): void {
    this.cloudflareStreamWebhookFailuresTotal.inc(count);
  }

  /**
   * Returns a structured snapshot of Golden Signals metrics for diagnostics.
   */
  async getMetricsSummary(): Promise<{
    uptimeSeconds: number;
    dbConnections: number;
    redisClients: number;
    metricRegistrySize: number;
  }> {
    const metricValues = await this.registry.getMetricsAsJSON();
    const dbMetric = metricValues.find(
      (m) => m.name === METRIC_NAMES.DB_POOL_ACTIVE_CONNECTIONS,
    );
    const redisMetric = metricValues.find(
      (m) => m.name === METRIC_NAMES.REDIS_CONNECTED_CLIENTS,
    );

    return {
      uptimeSeconds: process.uptime(),
      dbConnections: (dbMetric as any)?.values?.[0]?.value ?? 0,
      redisClients: (redisMetric as any)?.values?.[0]?.value ?? 0,
      metricRegistrySize: metricValues.length,
    };
  }

  /**
   * Resets all custom metrics in registry (primarily for test suite isolation).
   */
  resetMetrics(): void {
    this.registry.resetMetrics();
  }
}

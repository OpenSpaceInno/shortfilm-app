export const METRIC_NAMES = {
  HTTP_REQUEST_DURATION_SECONDS: 'http_request_duration_seconds',
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  INTERACTIVE_CHOICE_RESOLUTION_DURATION_MS: 'interactive_choice_resolution_duration_ms',
  BULLMQ_QUEUE_WAITING_JOBS: 'bullmq_queue_waiting_jobs',
  BULLMQ_QUEUE_FAILED_JOBS_TOTAL: 'bullmq_queue_failed_jobs_total',
  DB_POOL_ACTIVE_CONNECTIONS: 'db_pool_active_connections',
  REDIS_CONNECTED_CLIENTS: 'redis_connected_clients',
  CLOUDFLARE_STREAM_WEBHOOK_FAILURES_TOTAL: 'cloudflare_stream_webhook_failures_total',
} as const;

export const DEFAULT_HTTP_DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

export const DEFAULT_CHOICE_DURATION_BUCKETS = [
  5, 10, 20, 30, 40, 50, 60, 75, 100, 150, 250, 500,
];

export const SENSITIVE_FIELD_NAMES: readonly string[] = [
  'password',
  'refreshtoken',
  'token',
  'authorization',
  'payoutaccountdetails',
  'taxnumber',
  'cardnumber',
  'cvv',
  'creditcard',
  'secret',
  'cookie',
  'set-cookie',
  'apikey',
  'accesstoken',
  'idtoken',
];

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';
export const CF_RAY_HEADER = 'cf-ray';

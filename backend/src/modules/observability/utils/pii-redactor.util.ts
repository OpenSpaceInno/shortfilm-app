import { SENSITIVE_FIELD_NAMES } from '../constants/observability.constants';

const REDACTED_MASK = '[REDACTED]';

// Credit card regex (13 to 19 digits with optional dashes or spaces)
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

// JWT regex: matches typical eyJ... strings
const JWT_REGEX = /Bearer\s+ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi;

/**
 * Checks whether a given property key is deemed sensitive and should be masked.
 */
export function isSensitiveKey(key: string): boolean {
  if (!key) return false;
  const lower = key.toLowerCase().replace(/[-_]/g, '');
  return SENSITIVE_FIELD_NAMES.some((sensitive) => lower.includes(sensitive));
}

/**
 * Deeply redacts sensitive keys and values from an object or primitive.
 * Safely guards against circular object references.
 */
export function redactPii<T = unknown>(input: T, seen = new WeakSet()): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    let sanitized: string = input;
    if (CREDIT_CARD_REGEX.test(sanitized)) {
      sanitized = sanitized.replace(CREDIT_CARD_REGEX, REDACTED_MASK);
    }
    if (JWT_REGEX.test(sanitized)) {
      sanitized = sanitized.replace(JWT_REGEX, `Bearer ${REDACTED_MASK}`);
    }
    return sanitized as unknown as T;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (input instanceof Date || input instanceof RegExp || input instanceof Error) {
    return input;
  }

  if (seen.has(input)) {
    return '[CIRCULAR]' as unknown as T;
  }
  seen.add(input);

  if (Array.isArray(input)) {
    return input.map((item) => redactPii(item, seen)) as unknown as T;
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (isSensitiveKey(key)) {
      output[key] = REDACTED_MASK;
    } else {
      output[key] = redactPii(value, seen);
    }
  }

  return output as T;
}

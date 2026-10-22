import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ulid } from 'ulidx';

export interface CorrelationContext {
  correlationId: string;
  userId?: string;
  clientIp?: string;
  userAgent?: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CorrelationContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<CorrelationContext>();

  /**
   * Runs the provided function within the given AsyncLocalStorage context.
   */
  runWithContext<T>(context: CorrelationContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Retrieves the current correlation context if one is bound to the active async execution flow.
   */
  getContext(): CorrelationContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Returns the current correlation ID or a newly generated fallback ULID if called outside of request scope.
   */
  getCorrelationId(): string {
    const store = this.asyncLocalStorage.getStore();
    return store?.correlationId ?? `req_${ulid()}`;
  }

  /**
   * Returns the authenticated user ID if present in the context.
   */
  getUserId(): string | undefined {
    return this.asyncLocalStorage.getStore()?.userId;
  }

  /**
   * Returns the client IP if captured in the context.
   */
  getClientIp(): string | undefined {
    return this.asyncLocalStorage.getStore()?.clientIp;
  }

  /**
   * Returns the User-Agent if captured in the context.
   */
  getUserAgent(): string | undefined {
    return this.asyncLocalStorage.getStore()?.userAgent;
  }

  /**
   * Associates an authenticated user ID with the current request context.
   */
  setUserId(userId: string): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      store.userId = userId;
    }
  }

  /**
   * Attaches arbitrary contextual metadata to the current async scope.
   */
  setMetadata(key: string, value: unknown): void {
    const store = this.asyncLocalStorage.getStore();
    if (store) {
      if (!store.metadata) {
        store.metadata = {};
      }
      store.metadata[key] = value;
    }
  }
}

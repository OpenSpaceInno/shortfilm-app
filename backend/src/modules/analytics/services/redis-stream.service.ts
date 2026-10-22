import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_STREAM_MAX_LEN } from '../constants/analytics.constants';

export interface BufferedStreamItem {
  streamKey: string;
  fields: Record<string, string>;
  queuedAt: number;
}

@Injectable()
export class RedisStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;
  private readonly inMemoryBuffer: BufferedStreamItem[] = [];
  private readonly MAX_IN_MEMORY_BUFFER = 5000;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    try {
      this.redisClient = new Redis({
        host,
        port,
        password: password ? password : undefined,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          // Reconnect with exponential backoff up to 10s
          return Math.min(times * 500, 10000);
        },
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`Connected to Redis at ${host}:${port} for stream telemetry`);
        this.flushInMemoryBuffer();
      });

      this.redisClient.on('ready', () => {
        this.isConnected = true;
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        this.logger.debug(
          `Redis connection offline or unreachable at ${host}:${port}: ${err.message}. Buffering telemetry in memory.`,
        );
      });

      // Attempt async connection without blocking NestJS bootstrap
      this.redisClient.connect().catch((err) => {
        this.logger.warn(
          `Initial Redis connection failed (${host}:${port}): ${err.message}. Telemetry will be buffered in memory.`,
        );
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Redis client: ${err?.message || err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      try {
        if (typeof this.redisClient.quit === 'function') {
          await this.redisClient.quit();
        }
      } catch {
        if (typeof this.redisClient.disconnect === 'function') {
          this.redisClient.disconnect();
        }
      }
      this.redisClient = null;
      this.isConnected = false;
    }
  }

  /**
   * Appends a single telemetry record to the specified Redis stream using XADD.
   * If Redis is offline, gracefully saves to the bounded in-memory buffer.
   */
  async addToStream(
    streamKey: string,
    fields: Record<string, string>,
  ): Promise<string | null> {
    if (this.isConnected && this.redisClient) {
      try {
        const flatArgs: string[] = [];
        for (const [k, v] of Object.entries(fields)) {
          flatArgs.push(k, String(v));
        }

        const id = await this.redisClient.xadd(
          streamKey,
          'MAXLEN',
          '~',
          REDIS_STREAM_MAX_LEN,
          '*',
          ...flatArgs,
        );
        return id;
      } catch (err: any) {
        this.logger.warn(
          `XADD failed for stream '${streamKey}': ${err.message}. Falling back to in-memory buffer.`,
        );
        this.bufferInMemory(streamKey, fields);
        return null;
      }
    } else {
      this.bufferInMemory(streamKey, fields);
      return null;
    }
  }

  /**
   * Appends a batch of records to the specified Redis stream using a pipelined XADD transaction.
   * If Redis is offline, buffers all events in memory.
   */
  async addBatchToStream(
    streamKey: string,
    batch: Array<Record<string, string>>,
  ): Promise<number> {
    if (batch.length === 0) return 0;

    if (this.isConnected && this.redisClient) {
      try {
        const pipeline = this.redisClient.pipeline();
        for (const fields of batch) {
          const flatArgs: string[] = [];
          for (const [k, v] of Object.entries(fields)) {
            flatArgs.push(k, String(v));
          }
          pipeline.xadd(
            streamKey,
            'MAXLEN',
            '~',
            REDIS_STREAM_MAX_LEN,
            '*',
            ...flatArgs,
          );
        }

        await pipeline.exec();
        return batch.length;
      } catch (err: any) {
        this.logger.warn(
          `Batch XADD failed for stream '${streamKey}': ${err.message}. Falling back to in-memory buffer.`,
        );
        for (const fields of batch) {
          this.bufferInMemory(streamKey, fields);
        }
        return batch.length;
      }
    } else {
      for (const fields of batch) {
        this.bufferInMemory(streamKey, fields);
      }
      return batch.length;
    }
  }

  /**
   * Buffers items in memory when Redis is disconnected, with bounded FIFO eviction.
   */
  private bufferInMemory(streamKey: string, fields: Record<string, string>): void {
    if (this.inMemoryBuffer.length >= this.MAX_IN_MEMORY_BUFFER) {
      this.inMemoryBuffer.shift(); // Drop oldest event if buffer is saturated
    }
    this.inMemoryBuffer.push({
      streamKey,
      fields,
      queuedAt: Date.now(),
    });
  }

  /**
   * Flushes queued in-memory events to Redis stream upon reconnection.
   */
  private async flushInMemoryBuffer(): Promise<void> {
    if (!this.redisClient || !this.isConnected || this.inMemoryBuffer.length === 0) {
      return;
    }

    const count = this.inMemoryBuffer.length;
    this.logger.log(`Flushing ${count} in-memory buffered telemetry events to Redis Streams...`);

    const itemsToFlush = this.inMemoryBuffer.splice(0, count);
    try {
      const pipeline = this.redisClient.pipeline();
      for (const item of itemsToFlush) {
        const flatArgs: string[] = [];
        for (const [k, v] of Object.entries(item.fields)) {
          flatArgs.push(k, String(v));
        }
        pipeline.xadd(
          item.streamKey,
          'MAXLEN',
          '~',
          REDIS_STREAM_MAX_LEN,
          '*',
          ...flatArgs,
        );
      }
      await pipeline.exec();
      this.logger.log(`Successfully flushed ${count} buffered telemetry events to Redis Streams.`);
    } catch (err: any) {
      this.logger.error(`Error flushing telemetry buffer to Redis: ${err.message}`);
      // Re-queue remaining items if possible
      this.inMemoryBuffer.unshift(...itemsToFlush);
    }
  }

  isStreamConnected(): boolean {
    return this.isConnected;
  }

  getBufferedCount(): number {
    return this.inMemoryBuffer.length;
  }
}

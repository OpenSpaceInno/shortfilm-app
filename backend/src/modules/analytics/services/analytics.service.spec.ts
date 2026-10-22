import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { RedisStreamService } from './redis-stream.service';
import { AnalyticsEventType, REDIS_STREAM_KEY } from '../constants/analytics.constants';
import { AnalyticsEventDto } from '../dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let redisStreamService: jest.Mocked<RedisStreamService>;

  beforeEach(async () => {
    const mockRedisStreamService = {
      addToStream: jest.fn().mockResolvedValue('1728550000000-0'),
      addBatchToStream: jest.fn().mockImplementation(async (_, batch) => batch.length),
      isStreamConnected: jest.fn().mockReturnValue(true),
      getBufferedCount: jest.fn().mockReturnValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: RedisStreamService,
          useValue: mockRedisStreamService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    redisStreamService = module.get(RedisStreamService);
  });

  describe('anonymizeIp', () => {
    it('returns undefined if no IP provided', () => {
      expect(service.anonymizeIp(undefined)).toBeUndefined();
      expect(service.anonymizeIp('')).toBeUndefined();
    });

    it('handles localhost IP', () => {
      expect(service.anonymizeIp('127.0.0.1')).toBe('127.0.0.1-local');
      expect(service.anonymizeIp('::1')).toBe('127.0.0.1-local');
    });

    it('hashes external IP with daily salt into 16-character hex', () => {
      const hashed1 = service.anonymizeIp('203.0.113.195');
      const hashed2 = service.anonymizeIp('203.0.113.195');
      const hashedDifferent = service.anonymizeIp('198.51.100.4');

      expect(hashed1).toBeDefined();
      expect(hashed1).toHaveLength(16);
      expect(hashed1).toBe(hashed2);
      expect(hashed1).not.toBe(hashedDifferent);
    });

    it('extracts first IP from X-Forwarded-For multi-hop header', () => {
      const single = service.anonymizeIp('203.0.113.50');
      const multi = service.anonymizeIp('203.0.113.50, 10.0.0.1, 192.168.1.1');
      expect(multi).toBe(single);
    });
  });

  describe('normalizeEvent', () => {
    it('generates eventId and occurredAt if omitted', () => {
      const dto: AnalyticsEventDto = {
        eventType: AnalyticsEventType.VIDEO_STARTED,
        sessionId: 'sess-123',
      };

      const normalized = service.normalizeEvent(dto, '203.0.113.1', 'Mozilla/5.0');
      expect(normalized.eventId).toBeDefined();
      expect(normalized.eventId.length).toBeGreaterThanOrEqual(26);
      expect(normalized.occurredAt).toBeDefined();
      expect(normalized.clientIp).toBeDefined();
      expect(normalized.userAgent).toBe('Mozilla/5.0');
    });

    it('preserves client-provided eventId, occurredAt, and userId', () => {
      const dto: AnalyticsEventDto = {
        eventId: 'custom-event-id-999',
        eventType: AnalyticsEventType.CHOICE_SELECTED,
        sessionId: 'sess-456',
        userId: 'usr_explicit',
        occurredAt: '2026-10-10T12:00:00.000Z',
      };

      const normalized = service.normalizeEvent(dto, '203.0.113.1', 'ShortReel-App', 'usr_fallback');
      expect(normalized.eventId).toBe('custom-event-id-999');
      expect(normalized.userId).toBe('usr_explicit');
      expect(normalized.occurredAt).toBe('2026-10-10T12:00:00.000Z');
    });

    it('uses authenticated userId if omitted in payload', () => {
      const dto: AnalyticsEventDto = {
        eventType: AnalyticsEventType.PAYWALL_VIEWED,
        sessionId: 'sess-789',
      };

      const normalized = service.normalizeEvent(dto, undefined, undefined, 'usr_auth_jwt');
      expect(normalized.userId).toBe('usr_auth_jwt');
    });
  });

  describe('ingestEvent', () => {
    it('queues normalized event into Redis Stream and returns 202 response', async () => {
      const dto: AnalyticsEventDto = {
        eventType: AnalyticsEventType.VIDEO_25_PERCENT,
        sessionId: 'sess-binge-1',
        storyId: 'story-alpha',
        episodeId: 'ep-01',
        metrics: { playbackTimeSec: 22.5, totalDurationSec: 90.0 },
      };

      const res = await service.ingestEvent(dto, '198.51.100.10', 'TestAgent', 'usr-1');

      expect(res.accepted).toBe(true);
      expect(res.count).toBe(1);
      expect(res.ingestedAt).toBeDefined();

      expect(redisStreamService.addToStream).toHaveBeenCalledWith(
        REDIS_STREAM_KEY,
        expect.objectContaining({
          eventType: AnalyticsEventType.VIDEO_25_PERCENT,
          sessionId: 'sess-binge-1',
          storyId: 'story-alpha',
          episodeId: 'ep-01',
          userId: 'usr-1',
        }),
      );
    });
  });

  describe('ingestBatch', () => {
    it('returns count 0 if empty batch', async () => {
      const res = await service.ingestBatch([]);
      expect(res.accepted).toBe(true);
      expect(res.count).toBe(0);
      expect(redisStreamService.addBatchToStream).not.toHaveBeenCalled();
    });

    it('ingests batch of events using pipelined Redis Stream append', async () => {
      const events: AnalyticsEventDto[] = [
        {
          eventType: AnalyticsEventType.VIDEO_STARTED,
          sessionId: 'sess-batch',
          storyId: 'story-1',
        },
        {
          eventType: AnalyticsEventType.VIDEO_50_PERCENT,
          sessionId: 'sess-batch',
          storyId: 'story-1',
        },
        {
          eventType: AnalyticsEventType.CHOICE_SELECTED,
          sessionId: 'sess-batch',
          storyId: 'story-1',
          choiceId: 'choice-opt-b',
        },
      ];

      const res = await service.ingestBatch(events, '203.0.113.2', 'BatchPlayer', 'usr-2');

      expect(res.accepted).toBe(true);
      expect(res.count).toBe(3);
      expect(redisStreamService.addBatchToStream).toHaveBeenCalledWith(
        REDIS_STREAM_KEY,
        expect.arrayContaining([
          expect.objectContaining({ eventType: AnalyticsEventType.VIDEO_STARTED }),
          expect.objectContaining({ eventType: AnalyticsEventType.VIDEO_50_PERCENT }),
          expect.objectContaining({ eventType: AnalyticsEventType.CHOICE_SELECTED }),
        ]),
      );
    });
  });
});

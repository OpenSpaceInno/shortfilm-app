import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsEventType } from '../constants/analytics.constants';
import { AnalyticsBatchEventsDto, AnalyticsEventDto } from '../dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const mockAnalyticsService = {
      ingestEvent: jest.fn().mockResolvedValue({
        accepted: true,
        count: 1,
        ingestedAt: '2026-10-10T18:00:00.000Z',
      }),
      ingestBatch: jest.fn().mockImplementation(async (events) => ({
        accepted: true,
        count: events.length,
        ingestedAt: '2026-10-10T18:00:00.000Z',
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService);
  });

  const mockRequest = {
    headers: {
      'x-forwarded-for': '198.51.100.99',
      'user-agent': 'ShortReel-Web/1.0',
    },
    socket: { remoteAddress: '127.0.0.1' },
    user: { id: 'usr-auth-123' },
  } as any;

  describe('ingestEvents', () => {
    it('handles single event payload', async () => {
      const dto: AnalyticsEventDto = {
        eventType: AnalyticsEventType.VIDEO_STARTED,
        sessionId: 'sess-single',
      };

      const res = await controller.ingestEvents(dto, mockRequest);
      expect(res.accepted).toBe(true);
      expect(res.count).toBe(1);
      expect(analyticsService.ingestEvent).toHaveBeenCalledWith(
        dto,
        '198.51.100.99',
        'ShortReel-Web/1.0',
        'usr-auth-123',
      );
    });

    it('handles object batch payload with { events: [...] }', async () => {
      const batchPayload: AnalyticsBatchEventsDto = {
        events: [
          { eventType: AnalyticsEventType.VIDEO_STARTED, sessionId: 's1' },
          { eventType: AnalyticsEventType.VIDEO_COMPLETED, sessionId: 's1' },
        ],
      };

      const res = await controller.ingestEvents(batchPayload, mockRequest);
      expect(res.accepted).toBe(true);
      expect(res.count).toBe(2);
      expect(analyticsService.ingestBatch).toHaveBeenCalledWith(
        batchPayload.events,
        '198.51.100.99',
        'ShortReel-Web/1.0',
        'usr-auth-123',
      );
    });

    it('handles array payload [...] directly', async () => {
      const arrayPayload: AnalyticsEventDto[] = [
        { eventType: AnalyticsEventType.STORY_OPENED, sessionId: 's2' },
      ];

      const res = await controller.ingestEvents(arrayPayload, mockRequest);
      expect(res.accepted).toBe(true);
      expect(res.count).toBe(1);
      expect(analyticsService.ingestBatch).toHaveBeenCalledWith(
        arrayPayload,
        '198.51.100.99',
        'ShortReel-Web/1.0',
        'usr-auth-123',
      );
    });
  });

  describe('ingestBatch', () => {
    it('handles explicit /events/batch endpoint', async () => {
      const batchDto: AnalyticsBatchEventsDto = {
        events: [
          { eventType: AnalyticsEventType.CHECKOUT_STARTED, sessionId: 's3' },
          { eventType: AnalyticsEventType.PAYWALL_VIEWED, sessionId: 's3' },
        ],
      };

      const res = await controller.ingestBatch(batchDto, mockRequest);
      expect(res.accepted).toBe(true);
      expect(res.count).toBe(2);
      expect(analyticsService.ingestBatch).toHaveBeenCalledWith(
        batchDto.events,
        '198.51.100.99',
        'ShortReel-Web/1.0',
        'usr-auth-123',
      );
    });
  });
});

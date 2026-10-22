import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisStreamService } from './redis-stream.service';
import { REDIS_STREAM_KEY } from '../constants/analytics.constants';

// Mock ioredis completely to prevent actual TCP attempts and open handles
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      on: jest.fn().mockReturnThis(),
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      xadd: jest.fn().mockResolvedValue('1728550000000-0'),
      pipeline: jest.fn().mockReturnValue({
        xadd: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };
  });
});

describe('RedisStreamService', () => {
  let service: RedisStreamService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return 'localhost';
        if (key === 'REDIS_PORT') return 6379;
        if (key === 'REDIS_PASSWORD') return '';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisStreamService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisStreamService>(RedisStreamService);
    configService = module.get(ConfigService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('initializes without throwing', () => {
    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('buffers single telemetry event in memory when Redis is offline', async () => {
    service.onModuleInit();
    // Simulate disconnected state
    (service as any).isConnected = false;

    const fields = {
      eventId: 'evt-1',
      eventType: 'VIDEO_STARTED',
      sessionId: 'sess-1',
    };

    const id = await service.addToStream(REDIS_STREAM_KEY, fields);
    expect(id).toBeNull();
    expect(service.getBufferedCount()).toBe(1);
  });

  it('buffers batch telemetry events in memory when Redis is offline', async () => {
    service.onModuleInit();
    (service as any).isConnected = false;

    const batch = [
      { eventId: 'evt-1', eventType: 'VIDEO_STARTED', sessionId: 'sess-1' },
      { eventId: 'evt-2', eventType: 'VIDEO_COMPLETED', sessionId: 'sess-1' },
    ];

    const count = await service.addBatchToStream(REDIS_STREAM_KEY, batch);
    expect(count).toBe(2);
    expect(service.getBufferedCount()).toBe(2);
  });

  it('uses XADD when redisClient is connected', async () => {
    service.onModuleInit();

    const mockXAdd = jest.fn().mockResolvedValue('1728550000000-0');
    (service as any).redisClient = {
      xadd: mockXAdd,
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    };
    (service as any).isConnected = true;

    const fields = { eventId: 'evt-1', eventType: 'VIDEO_STARTED' };
    const id = await service.addToStream(REDIS_STREAM_KEY, fields);

    expect(id).toBe('1728550000000-0');
    expect(mockXAdd).toHaveBeenCalledWith(
      REDIS_STREAM_KEY,
      'MAXLEN',
      '~',
      100000,
      '*',
      'eventId',
      'evt-1',
      'eventType',
      'VIDEO_STARTED',
    );
  });

  it('uses pipeline for batch when redisClient is connected', async () => {
    service.onModuleInit();

    const mockXAdd = jest.fn();
    const mockExec = jest.fn().mockResolvedValue([]);
    const mockPipeline = jest.fn().mockReturnValue({
      xadd: mockXAdd,
      exec: mockExec,
    });

    (service as any).redisClient = {
      pipeline: mockPipeline,
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    };
    (service as any).isConnected = true;

    const batch = [
      { eventId: 'evt-1', eventType: 'VIDEO_STARTED' },
      { eventId: 'evt-2', eventType: 'VIDEO_COMPLETED' },
    ];

    const count = await service.addBatchToStream(REDIS_STREAM_KEY, batch);
    expect(count).toBe(2);
    expect(mockPipeline).toHaveBeenCalled();
    expect(mockXAdd).toHaveBeenCalledTimes(2);
    expect(mockExec).toHaveBeenCalled();
  });
});

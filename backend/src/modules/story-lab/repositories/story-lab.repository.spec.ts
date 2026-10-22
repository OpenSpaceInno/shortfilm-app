import { Test, TestingModule } from '@nestjs/testing';
import { StoryLabRepository } from './story-lab.repository';
import { DatabaseService, DRIZZLE_DB } from '../../../database/database.service';

describe('StoryLabRepository', () => {
  let repository: StoryLabRepository;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue([{}]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockDb);
      }),
    };

    const mockDbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryLabRepository,
        {
          provide: DRIZZLE_DB,
          useValue: mockDbService,
        },
      ],
    }).compile();

    repository = module.get<StoryLabRepository>(StoryLabRepository);
  });

  it('should query signals with limit and offset', async () => {
    mockDb.offset.mockResolvedValueOnce([{ signal: { id: 'sig-1' }, storyTitle: 'Story 1' }]);

    const res = await repository.findSignals({ limit: 10, offset: 0 });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('sig-1');
    expect(res[0].storyTitle).toBe('Story 1');
  });

  it('should create an experiment with variants within a transaction', async () => {
    mockDb.limit
      .mockResolvedValueOnce([{ id: 'exp-1', name: 'Test' }])
      .mockResolvedValueOnce([{ id: 'var-1' }, { id: 'var-2' }]);

    const res = await repository.createExperimentWithVariants(
      {
        storyId: 'story-1',
        name: 'Test',
        hypothesis: 'Hypothesis A',
        targetMetric: 'completion_rate',
        splitPercentage: 50,
      },
      { name: 'Control' },
      { name: 'Candidate' },
    );

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(res.id).toBe('exp-1');
  });

  it('should query opportunities', async () => {
    mockDb.offset.mockResolvedValueOnce([{ opportunity: { id: 'opp-1' }, storyTitle: 'Story 1' }]);

    const res = await repository.findOpportunities({ limit: 10 });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('opp-1');
  });
});

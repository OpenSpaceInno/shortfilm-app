import { QueryPlanService } from './query-plan.service';

describe('QueryPlanService', () => {
  let service: QueryPlanService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn(),
    };
    const mockDbService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };
    service = new QueryPlanService(mockDbService as any);
  });

  describe('explainQuery', () => {
    it('should classify const/ref indexed query as OPTIMAL', async () => {
      mockDb.execute.mockResolvedValue([
        [
          {
            id: 1,
            select_type: 'SIMPLE',
            table: 'stories',
            type: 'ref',
            possible_keys: 'idx_stories_status_published',
            key: 'idx_stories_status_published',
            rows: 5,
            filtered: 100,
          },
        ],
      ]);

      const result = await service.explainQuery(
        "SELECT * FROM stories WHERE status = 'PUBLISHED' ORDER BY published_at DESC LIMIT 10",
      );

      expect(result.grade).toBe('OPTIMAL');
      expect(result.accessType).toBe('ref');
      expect(result.usedIndex).toBe('idx_stories_status_published');
      expect(result.meetsSla).toBe(true);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should flag full table scan (type=ALL) on large tables with SLA warning', async () => {
      mockDb.execute.mockResolvedValue([
        [
          {
            id: 1,
            select_type: 'SIMPLE',
            table: 'xp_ledger',
            type: 'ALL',
            possible_keys: null,
            key: null,
            rows: 15000,
            filtered: 10,
          },
        ],
      ]);

      const result = await service.explainQuery(
        'SELECT SUM(points) FROM xp_ledger WHERE user_id = "usr_test"',
      );

      expect(result.grade).toBe('WARNING_SCAN');
      expect(result.accessType).toBe('ALL');
      expect(result.usedIndex).toBeNull();
      expect(result.meetsSla).toBe(false);
      expect(result.recommendations[0]).toContain('Full table scan (type=ALL) detected');
    });
  });

  describe('auditIndexes', () => {
    it('should verify critical schema indexes across all high-read tables', async () => {
      mockDb.execute.mockResolvedValue([
        [
          { table_name: 'stories', index_name: 'idx_stories_status_published' },
          { table_name: 'episodes', index_name: 'idx_episodes_season_number' },
          { table_name: 'watch_progress', index_name: 'uq_wp_user_episode' },
          { table_name: 'user_choices', index_name: 'uq_user_choices_user_choice' },
          { table_name: 'xp_ledger', index_name: 'idx_xp_user_points' },
          { table_name: 'story_versions', index_name: 'idx_sv_story_status' },
          { table_name: 'subscriptions', index_name: 'idx_sub_user_status' },
        ],
      ]);

      const audit = await service.auditIndexes();

      expect(audit.totalIndexesAudited).toBe(7);
      expect(audit.verifiedCount).toBe(7);
      expect(audit.missingCount).toBe(0);
      expect(audit.allVerified).toBe(true);
    });
  });
});

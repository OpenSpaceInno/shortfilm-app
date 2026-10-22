# 22. SHORTREEL — SEARCH

## V1: MySQL 8.x Full-Text Search

FULLTEXT indexes on: stories(title, synopsis, premise), creators(display_name, bio), characters(name, bio)

Query pattern (Boolean Mode):
`sql
SELECT id, title, MATCH(title,synopsis,premise) AGAINST(? IN BOOLEAN MODE) AS score
FROM stories WHERE status='PUBLISHED'
  AND MATCH(title,synopsis,premise) AGAINST(? IN BOOLEAN MODE)
ORDER BY score DESC, view_count DESC LIMIT 20;
`

Cache: Redis key search:query:{hash(q+type)} TTL 15 minutes

## SearchService Abstraction (for future Meilisearch)

`	ypescript
interface SearchService {
  search(query: string, filters: SearchFilters, pagination: PaginationDto): Promise<SearchResults>;
  indexStory(story: Story): Promise<void>;
  removeFromIndex(type: string, id: string): Promise<void>;
}
class MysqlSearchService implements SearchService { ... }
class MeilisearchService implements SearchService { ... }  // future
`

## Migration Trigger

Introduce Meilisearch when:
- MySQL FTS p95 latency > 150ms at peak load
- Catalogue > 50,000 stories
- Typo-tolerance becomes a product requirement

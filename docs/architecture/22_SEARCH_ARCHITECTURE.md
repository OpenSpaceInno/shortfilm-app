# 22. SHORTREEL — SEARCH & DISCOVERY ARCHITECTURE

> **Document ID:** SR-ARCH-22  
> **Phase:** Phase 4 — Backend Architecture & Technical Design Freeze  
> **Status:** RATIFIED & FROZEN  

---

## 1. Architectural Philosophy: Pragmatic Progression

Search in ShortReel must support fast discovery across stories, creators, characters, genres, and narrative tags.

> [!IMPORTANT]
> **Pragmatic Complexity Rule**:
> Do **NOT** introduce a standalone external search cluster (Elasticsearch, OpenSearch, Meilisearch) in V1.
> Operating a dedicated cluster introduces distributed state, synchronization drift, operational maintenance, and unnecessary infrastructure costs before catalogue volume warrants it.
>
> **Phase 4 Baseline**: Leverage **MySQL 8.x InnoDB Full-Text Search (FTS) with ngram parser** and Redis cache.
> **Future Migration Seam**: Define an abstracted `SearchService` interface to swap to Meilisearch / OpenSearch seamlessly when the catalogue exceeds ~50,000 indexable records.

```text
                                  ┌───────────────────────────────┐
                                  │      Client Search Query      │
                                  │    GET /api/v1/search?q=noir  │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │      SearchModule (NestJS)    │
                                  └──────────────┬────────────────┘
                                                 │
                                 ┌───────────────┴───────────────┐
                                 ▼                               ▼
                      ┌──────────────────────┐       ┌──────────────────────┐
                      │ Cache Hit (< 5ms)    │       │ Cache Miss           │
                      │ Redis Key            │       │ MySQL 8.x InnoDB FTS │
                      │ search:query:{hash}  │       │ MATCH(...) AGAINST() │
                      └──────────────────────┘       └──────────┬───────────┘
                                                                │
                                                                ▼
                                                     ┌──────────────────────┐
                                                     │ Populate Redis Cache │
                                                     │ (TTL: 15 minutes)    │
                                                     └──────────────────────┘
```

---

## 2. MySQL 8.x Full-Text Search Implementation

### 2.1 Index Definitions
To allow multi-field matching without heavy runtime `LIKE %query%` scans, MySQL 8.x full-text indexes are configured on published content tables:

1. **`stories` Full-Text Index**:
   ```sql
   ALTER TABLE stories ADD FULLTEXT INDEX ft_stories_search (title, synopsis, premise);
   ```
2. **`creators` Full-Text Index**:
   ```sql
   ALTER TABLE creators ADD FULLTEXT INDEX ft_creators_search (display_name, bio);
   ```
3. **`characters` Full-Text Index**:
   ```sql
   ALTER TABLE characters ADD FULLTEXT INDEX ft_characters_search (name, bio, role_description);
   ```

### 2.2 Query Formulation & Relevance Ranking
Search queries use Boolean Mode for prefix and fuzzy matching:
```sql
SELECT 
    s.id, 
    s.title, 
    s.synopsis, 
    s.thumbnail_url,
    MATCH(s.title, s.synopsis, s.premise) AGAINST(? IN BOOLEAN MODE) AS relevance_score
FROM stories s
WHERE s.status = 'PUBLISHED'
  AND MATCH(s.title, s.synopsis, s.premise) AGAINST(? IN BOOLEAN MODE)
ORDER BY relevance_score DESC, s.view_count DESC
LIMIT 20 OFFSET 0;
```

---

## 3. Search Category Aggregations

The unified search endpoint (`GET /api/v1/search`) returns segmented results grouped by entity:

```typescript
export interface UnifiedSearchResponseDto {
  query: string;
  results: {
    stories: StorySearchResultDto[];
    creators: CreatorSearchResultDto[];
    characters: CharacterSearchResultDto[];
    genres: GenreDto[];
    tags: TagDto[];
  };
  totalMatches: number;
}
```

---

## 4. Future Dedicated Search Engine Migration Seam

The `SearchService` interface abstracts search mechanics:

```typescript
export interface SearchService {
  search(query: string, filters: SearchFilters, pagination: PaginationDto): Promise<UnifiedSearchResponseDto>;
  indexStory(story: StoryDocument): Promise<void>;
  indexCreator(creator: CreatorDocument): Promise<void>;
  removeFromIndex(entityType: string, entityId: string): Promise<void>;
}
```

### Migration Trigger Conditions (Revisit Criteria)
A dedicated search engine (recommendation: **Meilisearch** for typotolerance and fast developer velocity, or **OpenSearch** for enterprise scale) will be introduced when:
1. Search query latency on MySQL FTS exceeds **150ms** at p95 under standard peak load.
2. Complex typo-tolerance (Levenshtein distance `fuzzy > 2`) becomes a mandatory product requirement.
3. Catalogue exceeds **50,000 active stories/episodes**.

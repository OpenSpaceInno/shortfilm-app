import {
  genres,
  tags,
  stories,
  seasons,
  episodes,
  videos,
  characters,
  storyGenres,
  storyTags,
  creators,
  StoryStatusEnum,
  CreatorTierEnum,
  CreatorStatusEnum,
} from './index';

describe('Content & Creator Schema Definitions', () => {
  it('should define creators table correctly with enum constraints', () => {
    expect(creators).toBeDefined();
    expect(CreatorTierEnum).toContain('VERIFIED');
    expect(CreatorTierEnum).toContain('EMERGING');
    expect(CreatorStatusEnum).toContain('ACTIVE');
  });

  it('should define genres and tags tables', () => {
    expect(genres).toBeDefined();
    expect(tags).toBeDefined();
    expect(genres.name).toBeDefined();
    expect(genres.slug).toBeDefined();
  });

  it('should define stories table with status enum and relationships', () => {
    expect(stories).toBeDefined();
    expect(StoryStatusEnum).toContain('DRAFT');
    expect(StoryStatusEnum).toContain('PUBLISHED');
    expect(stories.creatorId).toBeDefined();
    expect(stories.viewCount).toBeDefined();
  });

  it('should define seasons and episodes tables', () => {
    expect(seasons).toBeDefined();
    expect(episodes).toBeDefined();
    expect(seasons.storyId).toBeDefined();
    expect(episodes.seasonId).toBeDefined();
    expect(episodes.isFree).toBeDefined();
  });

  it('should define junction tables and characters', () => {
    expect(storyGenres).toBeDefined();
    expect(storyTags).toBeDefined();
    expect(characters).toBeDefined();
    expect(videos).toBeDefined();
  });
});

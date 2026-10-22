-- ShortReel Full-Text Search Indexes Migration
-- Database: MySQL 8.x (InnoDB)
-- Collation: utf8mb4_0900_ai_ci

-- Add FULLTEXT index on stories (title, synopsis, premise)
SET @exist_stories := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'stories'
    AND index_name = 'ft_stories'
);
SET @sql_stories := IF(@exist_stories = 0, 'ALTER TABLE stories ADD FULLTEXT INDEX ft_stories (title, synopsis, premise);', 'SELECT 1;');
PREPARE stmt FROM @sql_stories;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add FULLTEXT index on creators (display_name, bio)
SET @exist_creators := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'creators'
    AND index_name = 'ft_creators'
);
SET @sql_creators := IF(@exist_creators = 0, 'ALTER TABLE creators ADD FULLTEXT INDEX ft_creators (display_name, bio);', 'SELECT 1;');
PREPARE stmt FROM @sql_creators;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add FULLTEXT index on characters (name, bio)
SET @exist_chars := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'characters'
    AND index_name = 'ft_characters'
);
SET @sql_chars := IF(@exist_chars = 0, 'ALTER TABLE characters ADD FULLTEXT INDEX ft_characters (name, bio);', 'SELECT 1;');
PREPARE stmt FROM @sql_chars;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

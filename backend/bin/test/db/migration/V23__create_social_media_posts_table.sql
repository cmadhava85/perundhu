-- V23__create_social_media_posts_table.sql
-- Migration to create social media posts tracking table

CREATE TABLE social_media_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    post_id VARCHAR(100) NOT NULL,
    author_id VARCHAR(100) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT,
    image_urls JSON,
    post_url VARCHAR(500),
    published_at TIMESTAMP NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score DOUBLE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_platform_post_id (platform, post_id),
    INDEX idx_platform_post_id (platform, post_id),
    INDEX idx_published_at (published_at),
    INDEX idx_processed (processed),
    INDEX idx_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores social media posts discovered from Twitter, Facebook, Instagram for route contributions';

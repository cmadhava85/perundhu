# Social Media Integration - Implementation Status

## Overview
This document tracks the implementation of social media monitoring for bus route contributions within the existing Perundhu backend module, following hexagonal architecture principles.

---

## ✅ Completed Components

### 1. Dependencies Added (build.gradle)
- **Twitter4J**: `io.github.takke:jp.takke.twitter4j:4.0.7.3`
- **RestFB** (Facebook/Instagram): `com.restfb:restfb:2024.12.0`
- **YouTube Data API**: Google API client libraries
- **HTTP Client**: Apache HttpClient5
- **Quartz Scheduler**: Spring Boot Starter Quartz

### 2. Domain Layer (`com.perundhu.domain`)

#### Models (`domain/model`)
- ✅ **SocialMediaPlatform** (enum)
  - TWITTER, FACEBOOK, INSTAGRAM, YOUTUBE
  - Display names and codes
  - Pure domain model (no framework dependencies)

- ✅ **SocialMediaPost**
  - Domain entity representing social media posts
  - Builder pattern for construction
  - Business methods: `markAsProcessed()`, `hasImages()`, `hasContent()`
  - Validation in builder

#### Ports (`domain/port`)

**Output Ports** (`domain/port/output`):
- ✅ **TwitterApiOutputPort** - Twitter API operations interface
  - `searchMentions()` - Find mentions of @PerundhuRoutes
  - `searchByHashtags()` - Search by hashtags
  - `replyToTweet()` - Acknowledge contributions
  
- ✅ **FacebookApiOutputPort** - Facebook API operations interface
  - `fetchPagePosts()` - Get posts from official page
  - `fetchVisitorPosts()` - Get visitor contributions
  - `fetchPostComments()` - Get comments for processing
  - `commentOnPost()` - Acknowledge contributions
  
- ✅ **InstagramApiOutputPort** - Instagram API operations interface
  - `searchByHashtag()` - Search #PerundhuRoutes
  - `fetchAccountMedia()` - Get official account posts
  - `fetchMediaComments()` - Get comments
  
- ✅ **SocialMediaPostOutputPort** - Persistence interface
  - `save()` - Persist social media posts
  - `findByPlatformAndPostId()` - Check for duplicates
  - `isAlreadyProcessed()` - Avoid reprocessing

**Input Ports** (`domain/port/input`):
- ✅ **SocialMediaMonitoringInputPort** - Use case interface
  - `monitorAllPlatforms()` - Scheduled monitoring
  - `monitorPlatform()` - Single platform monitoring
  - `processPost()` - Extract route data from post
  - `getStatistics()` - Monitoring metrics
  - Inner classes: `MonitoringResult`, `MonitoringStatistics`

---

## 🚧 Pending Implementation

### 3. Application Layer (`com.perundhu.application`)

#### Services (`application/service`)
- ⏳ **SocialMediaMonitoringService** (implements SocialMediaMonitoringInputPort)
  - Orchestrates monitoring across platforms
  - Uses RouteTextParser for NLP extraction
  - Uses OCR service for image processing
  - Calls ContributionInputPort to create contributions
  - Dependency injection via constructor

```java
@Service
public class SocialMediaMonitoringService implements SocialMediaMonitoringInputPort {
    private final TwitterApiOutputPort twitterApi;
    private final FacebookApiOutputPort facebookApi;
    private final InstagramApiOutputPort instagramApi;
    private final SocialMediaPostOutputPort postRepository;
    private final RouteTextParser routeTextParser;
    private final OCRService ocrService;
    private final ContributionInputPort contributionInputPort;
    
    // Implementation methods...
}
```

### 4. Infrastructure Layer

#### Outbound Adapters (`adapter/out/socialmedia`)
- ⏳ **TwitterApiAdapter** (implements TwitterApiOutputPort)
  - Uses Twitter4J library
  - Configuration: API keys from properties
  - Rate limiting handling
  - Error handling and logging

- ⏳ **FacebookApiAdapter** (implements FacebookApiOutputPort)
  - Uses RestFB library
  - Configuration: Page ID, access token
  - Pagination handling
  - Image URL extraction

- ⏳ **InstagramApiAdapter** (implements InstagramApiOutputPort)
  - Uses RestFB (Instagram Graph API)
  - Configuration: Business account ID, access token
  - Hashtag ID resolution
  - Media URL extraction

#### Persistence Adapter (`adapter/out/persistence`)
- ⏳ **SocialMediaPostPersistenceAdapter** (implements SocialMediaPostOutputPort)
  - JPA entity mapping
  - Repository implementation
  - Duplicate detection

#### JPA Entities (`infrastructure/persistence`)
- ⏳ **SocialMediaPostJpaEntity**
  - Table: `social_media_posts`
  - Fields: id, platform, postId, authorId, authorName, content, imageUrls (JSON), postUrl, publishedAt, processed, confidenceScore, createdAt, updatedAt
  - Indexes: (platform, postId) unique, processed, publishedAt

- ⏳ **SocialMediaPostJpaRepository**
  - Spring Data JPA repository
  - Custom queries for duplicate detection

#### Scheduling (`infrastructure/scheduling`)
- ⏳ **SocialMediaMonitoringScheduler**
  - Quartz job or @Scheduled annotation
  - Cron: Every 5 minutes
  - Calls `monitorAllPlatforms()`
  - Error handling and logging

#### Configuration (`infrastructure/config`)
- ⏳ **SocialMediaConfig**
  - Bean definitions for adapters
  - API credential injection
  - Feature flags for enabling/disabling platforms

- ⏳ **application.yml properties**
```yaml
socialmedia:
  enabled: true
  monitoring:
    schedule: "0 */5 * * * ?" # Every 5 minutes
  twitter:
    enabled: true
    api-key: ${TWITTER_API_KEY}
    api-secret: ${TWITTER_API_SECRET}
    access-token: ${TWITTER_ACCESS_TOKEN}
    access-token-secret: ${TWITTER_ACCESS_TOKEN_SECRET}
    account-handle: "@PerundhuRoutes"
    branded-hashtags:
      - "PerundhuRoutes"
      - "PerundhuBus"
      - "ShareBusRoute"
    community-hashtags:
      - "TNSTCbus"
      - "MTCBus"
  facebook:
    enabled: true
    page-id: ${FACEBOOK_PAGE_ID}
    access-token: ${FACEBOOK_ACCESS_TOKEN}
  instagram:
    enabled: true
    user-id: ${INSTAGRAM_USER_ID}
    access-token: ${INSTAGRAM_ACCESS_TOKEN}
    branded-hashtag: "PerundhuRoutes"
```

### 5. Database Migration
- ⏳ **Flyway migration**: `V{next}_create_social_media_posts.sql`
```sql
CREATE TABLE social_media_posts (
    id VARCHAR(36) PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255),
    content TEXT,
    image_urls JSON,
    post_url VARCHAR(500),
    published_at TIMESTAMP NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_platform_post (platform, post_id),
    INDEX idx_processed (processed),
    INDEX idx_published_at (published_at),
    INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure (Current)
- [x] Add dependencies to build.gradle
- [x] Create domain models
- [x] Create all output port interfaces
- [x] Create input port interface
- [ ] Create application service implementation
- [ ] Create configuration class
- [ ] Add application.yml properties

### Phase 2: Adapters
- [ ] Implement TwitterApiAdapter
- [ ] Implement FacebookApiAdapter
- [ ] Implement InstagramApiAdapter
- [ ] Implement SocialMediaPostPersistenceAdapter
- [ ] Create JPA entity and repository
- [ ] Create database migration

### Phase 3: Scheduling & Testing
- [ ] Implement scheduler
- [ ] Write unit tests for application service
- [ ] Write integration tests for adapters
- [ ] Write end-to-end tests

### Phase 4: Documentation & Deployment
- [ ] Update README with social media integration
- [ ] Create API setup guide (Twitter, Facebook, Instagram)
- [ ] Add monitoring dashboard (optional)
- [ ] Deploy and test with real credentials

---

## Package Structure

```
backend/app/src/main/java/com/perundhu/
├── adapter/
│   ├── in/rest/
│   │   └── (existing controllers)
│   └── out/
│       ├── persistence/
│       │   ├── (existing adapters)
│       │   └── SocialMediaPostPersistenceAdapter.java  ← NEW
│       └── socialmedia/  ← NEW PACKAGE
│           ├── TwitterApiAdapter.java
│           ├── FacebookApiAdapter.java
│           └── InstagramApiAdapter.java
├── application/service/
│   ├── (existing services)
│   └── SocialMediaMonitoringService.java  ← NEW
├── domain/
│   ├── model/
│   │   ├── (existing models)
│   │   ├── SocialMediaPlatform.java  ✅ DONE
│   │   └── SocialMediaPost.java  ✅ DONE
│   └── port/
│       ├── input/
│       │   ├── (existing ports)
│       │   └── SocialMediaMonitoringInputPort.java  ✅ DONE
│       └── output/
│           ├── (existing ports)
│           ├── TwitterApiOutputPort.java  ✅ DONE
│           ├── FacebookApiOutputPort.java  ✅ DONE
│           ├── InstagramApiOutputPort.java  ✅ DONE
│           └── SocialMediaPostOutputPort.java  ✅ DONE
└── infrastructure/
    ├── config/
    │   ├── (existing configs)
    │   └── SocialMediaConfig.java  ← NEW
    ├── persistence/
    │   ├── (existing entities)
    │   ├── SocialMediaPostJpaEntity.java  ← NEW
    │   └── SocialMediaPostJpaRepository.java  ← NEW
    └── scheduling/
        └── SocialMediaMonitoringScheduler.java  ← NEW
```

---

## Next Steps

1. **Implement Application Service** - Core business logic
2. **Create Configuration** - Wire everything together
3. **Implement Twitter Adapter** - Start with one platform
4. **Test Twitter Integration** - Verify end-to-end flow
5. **Implement Facebook & Instagram** - Add remaining platforms
6. **Create Database Migration** - Persist monitoring data
7. **Add Scheduling** - Automate monitoring
8. **Deploy & Test** - Production ready

---

## API Credentials Required

To enable this feature, obtain:

1. **Twitter Developer Account**
   - Create app at: https://developer.twitter.com
   - Get: API Key, API Secret, Access Token, Access Token Secret
   - Enable OAuth 1.0a

2. **Facebook Developer Account**
   - Create app at: https://developers.facebook.com
   - Create Facebook Page
   - Get: Page ID, long-lived Page Access Token

3. **Instagram Business Account**
   - Convert Instagram to Business account
   - Link to Facebook Page
   - Use same access token as Facebook

---

**Status**: Foundation Complete - Ready for Application Layer Implementation
**Last Updated**: December 2, 2025

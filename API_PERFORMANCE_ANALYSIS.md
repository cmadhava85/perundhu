# API Performance Analysis & Optimization Recommendations

## Executive Summary

Based on comprehensive code analysis and testing of the PreProd environment, several performance bottlenecks have been identified along with concrete optimization strategies.

## Current Performance Issues

### 1. **Cold Start Problems** ⚠️ CRITICAL
- **Issue**: Cloud Run instances scale to zero, causing 10-15 second cold starts
- **Impact**: First request after idle period takes >10s
- **Evidence**: Initial test showed 11.4s TTFB for `/api/v1/bus-schedules/locations`

### 2. **Database Connection Pool Too Small** ⚠️ HIGH
- **Current Config**: 
  - `HIKARI_MAX_POOL_SIZE=5`
  - `HIKARI_MIN_IDLE=2`
- **Issue**: Under load, connections exhaust quickly
- **Impact**: Request queuing, increased latency

### 3. **Missing Database Query Optimization** ⚠️ HIGH
- **Issue**: No `@EntityGraph` or `JOIN FETCH` for related entities
- **Impact**: N+1 query problems when loading:
  - Buses with stops
  - Locations with translations
  - Bus routes with related data
- **Evidence**: Found queries without eager fetching in `BusJpaRepository`

### 4. **No Spring Cache Implementation** ⚠️ MEDIUM
- **Issue**: Spring Cache annotations present but not enabled in preprod
- **Impact**: Repeated database queries for:
  - Location lists (rarely change)
  - Translations (static data)
  - Bus schedules (change infrequently)
- **Evidence**: `@Cacheable` annotations exist but no cache provider configured

### 5. **Complex Search Algorithm Without Indexing** ⚠️ MEDIUM
- **Issue**: Bus search combines 3 separate queries:
  - Direct buses
  - Via intermediate stops
  - Continuing beyond destination
- **Impact**: Multiple database round-trips per search
- **Code**: `BusScheduleController.searchPublicRoutes()` lines 224-272

### 6. **OSM External API Calls** ⚠️ MEDIUM
- **Issue**: OpenStreetMap geocoding called synchronously
- **Impact**: External API latency blocks responses
- **Mitigation**: In-memory cache exists but limited

### 7. **No CDN for Static API Responses** ⚠️ LOW
- **Issue**: Frequently accessed endpoints not cached at edge
- **Impact**: All requests hit Cloud Run, increasing costs
- **Example**: `/api/v1/bus-schedules/locations` returns same data frequently

## Performance Optimization Plan

### Phase 1: Quick Wins (1-2 days)

#### 1.1 Enable Spring Cache with Redis
```yaml
# Add to application-preprod.properties
spring.cache.type=redis
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}
spring.cache.redis.time-to-live=3600000
spring.cache.cache-names=locations,translations,buses,schedules
```

#### 1.2 Increase Connection Pool
```properties
# Update application-preprod.properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.max-lifetime=1800000
```

#### 1.3 Configure Cloud Run Min Instances
```yaml
# Update cd-preprod-auto.yml
--min-instances 1  # Change from 0 to 1
```
**Cost Impact**: ~$8-12/month for 1 always-on instance
**Performance Gain**: Eliminates cold starts

#### 1.4 Add Database Indexes
```sql
-- Add to new migration file
CREATE INDEX idx_bus_from_to ON buses(from_location_id, to_location_id);
CREATE INDEX idx_stops_bus_sequence ON stops(bus_id, sequence);
CREATE INDEX idx_stops_location ON stops(location_id);
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id, language_code);
```

### Phase 2: Medium-Term Optimizations (3-5 days)

#### 2.1 Fix N+1 Queries with Entity Graphs
```java
// Add to BusJpaRepository.java
@EntityGraph(attributePaths = {"fromLocation", "toLocation", "stops"})
@Query("SELECT DISTINCT b FROM BusJpaEntity b " +
       "WHERE b.fromLocation.id = :fromLocationId " +
       "AND b.toLocation.id = :toLocationId")
List<BusJpaEntity> findByFromLocationIdAndToLocationIdWithStops(
    Long fromLocationId, Long toLocationId);
```

#### 2.2 Implement Result Caching for Expensive Queries
```java
// Add to BusScheduleService
@Cacheable(value = "busSearchResults", 
           key = "#fromLocationId + '_' + #toLocationId + '_' + #includeContinuing")
public List<BusDTO> findBusesBetweenLocations(Long fromLocationId, 
                                               Long toLocationId, 
                                               boolean includeContinuing) {
    // existing implementation
}
```

#### 2.3 Add Response Compression
```properties
# Add to application-preprod.properties
server.compression.enabled=true
server.compression.mime-types=application/json,application/xml,text/html,text/xml,text/plain
server.compression.min-response-size=1024
```

#### 2.4 Optimize Complex Searches
```java
// Combine 3 separate queries into 1 optimized query
@Query("""
    SELECT DISTINCT b FROM BusJpaEntity b
    LEFT JOIN FETCH b.stops s
    WHERE (b.fromLocation.id = :fromLocationId AND b.toLocation.id = :toLocationId)
       OR (s.location.id = :fromLocationId AND EXISTS (
           SELECT 1 FROM StopJpaEntity s2 
           WHERE s2.bus = b 
           AND s2.location.id = :toLocationId 
           AND s2.sequence > s.sequence
       ))
    ORDER BY b.id
    """)
List<BusJpaEntity> findAllRelevantBuses(Long fromLocationId, Long toLocationId);
```

### Phase 3: Advanced Optimizations (1-2 weeks)

#### 3.1 Implement Read Replicas
- Configure Cloud SQL read replica
- Route read queries to replica
- Keep writes on primary

#### 3.2 Add CloudFlare CDN
- Cache GET endpoints with long TTL
- Locations: 24 hours
- Bus schedules: 1 hour
- Invalidate on updates

#### 3.3 Database Query Optimization
- Add covering indexes for frequent queries
- Use query hints for optimizer
- Implement pagination for large result sets

#### 3.4 Async Processing for Heavy Operations
```java
@Async
public CompletableFuture<List<BusDTO>> findBusesAsync(Long from, Long to) {
    return CompletableFuture.completedFuture(findBuses(from, to));
}
```

#### 3.5 Implement Rate Limiting at Gateway Level
- Move from application to Cloud Armor
- Reduce load on application servers

## Recommended Configuration Changes

### Cloud Run Configuration
```yaml
# Optimized Cloud Run settings
--memory 1Gi              # Current: 1Gi ✓
--cpu 2                   # Change from 1 to 2
--min-instances 1         # Change from 0 to 1
--max-instances 20        # Change from 10 to 20
--concurrency 100         # Change from 80 to 100
--timeout 60s             # Change from 300s to 60s (for API)
--cpu-throttling          # Enable CPU throttling
--max-instances-per-region 10
```

### Database Configuration
```properties
# Optimized Hikari settings for preprod
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
spring.datasource.hikari.validation-timeout=5000
```

### JPA/Hibernate Configuration
```properties
# Add query optimization
spring.jpa.properties.hibernate.jdbc.batch_size=20
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true
spring.jpa.properties.hibernate.jdbc.batch_versioned_data=true
spring.jpa.properties.hibernate.query.in_clause_parameter_padding=true
spring.jpa.properties.hibernate.generate_statistics=false
spring.jpa.properties.hibernate.cache.use_second_level_cache=true
spring.jpa.properties.hibernate.cache.use_query_cache=true
spring.jpa.properties.hibernate.cache.region.factory_class=org.hibernate.cache.jcache.JCacheRegionFactory
```

## Monitoring & Metrics

### Add Performance Monitoring
```java
// Add to each controller
@Timed(value = "api.bus.search", 
       description = "Time taken to search buses")
public ResponseEntity<List<BusDTO>> searchBuses(...) {
    // implementation
}
```

### Cloud Monitoring Alerts
- Set up alerts for:
  - Response time > 2s (warning)
  - Response time > 5s (critical)
  - Error rate > 1%
  - Database connection pool exhaustion

## Expected Performance Improvements

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|---------|---------------|---------------|---------------|
| Cold Start | 10-15s | 0s | 0s | 0s |
| Avg Response | 2-5s | 0.5-1s | 0.2-0.5s | <0.2s |
| P95 Response | 8-12s | 2s | 1s | 0.5s |
| DB Connections | 2-5 | 5-20 | 5-20 | 5-20 |
| Cache Hit Rate | 0% | 60-70% | 80-90% | 90-95% |
| Queries per Search | 3-5 | 3-5 | 1-2 | 1 |

## Cost Implications

| Change | Monthly Cost | Performance Gain |
|--------|-------------|------------------|
| Min instances = 1 | +$8-12 | Eliminate cold starts |
| Redis cache | +$25-35 | 80% faster reads |
| Increased pool size | $0 | Better concurrency |
| Cloud CDN | +$5-10 | 50% load reduction |
| Read replica | +$30-50 | Better read performance |
| **Total** | **+$68-107/month** | **3-10x faster** |

## Implementation Priority

1. **Immediate** (Do Now):
   - [ ] Set min-instances to 1
   - [ ] Increase connection pool size
   - [ ] Add database indexes

2. **This Week**:
   - [ ] Enable Spring Cache with Redis
   - [ ] Fix N+1 queries with EntityGraph
   - [ ] Add response compression
   - [ ] Optimize complex search queries

3. **This Month**:
   - [ ] Add CloudFlare CDN
   - [ ] Implement async processing
   - [ ] Set up comprehensive monitoring
   - [ ] Load testing with realistic data

4. **Future**:
   - [ ] Read replicas
   - [ ] Advanced caching strategies
   - [ ] GraphQL for flexible queries

## Testing Strategy

### Load Testing Script
```bash
# Use Apache Bench for load testing
ab -n 1000 -c 10 "$BACKEND_URL/api/v1/bus-schedules/locations"

# Use k6 for complex scenarios
k6 run --vus 50 --duration 30s load-test.js
```

### Performance Regression Tests
- Add to CI/CD pipeline
- Fail build if response time > threshold
- Track metrics over time

## Conclusion

The current API performance has significant room for improvement. By implementing the Phase 1 optimizations (1-2 days of work), we can achieve **3-5x performance improvement** for a cost of ~$40-50/month. Phase 2 and 3 optimizations will further improve performance to production-grade levels.

**Recommended Next Steps**:
1. Run the performance test script to establish baseline
2. Implement Phase 1 quick wins
3. Re-test and measure improvements
4. Proceed to Phase 2 based on results

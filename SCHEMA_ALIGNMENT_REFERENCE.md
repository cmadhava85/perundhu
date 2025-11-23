# Database Schema Alignment - Complete Reference

## Overview
This document tracks all database tables, their columns, and alignment with JPA entities to prevent schema validation errors.

---

## 📋 Table Inventory

### 1. **buses** table
**Entity:** `BusJpaEntity.java`  
**Migration:** V1__init.sql (base), V6__add_performance_indexes.sql (computed columns), V10__add_missing_columns.sql (missing fields), V11__ensure_timestamps_and_final_alignment.sql (timestamps)

| Column | Type | Required | Description | Added In |
|--------|------|----------|-------------|----------|
| id | BIGINT | Yes | Primary key | V1 |
| name | VARCHAR(255) | Yes | Bus route name | V1 |
| bus_number | VARCHAR(50) | Yes | Bus identification number | V1 |
| from_location_id | BIGINT | Yes | Origin location FK | V1 |
| to_location_id | BIGINT | Yes | Destination location FK | V1 |
| departure_time | TIME | Yes | Departure time | V1 |
| arrival_time | TIME | Yes | Arrival time | V1 |
| capacity | INT | No | Passenger capacity (default 50) | V10 |
| category | VARCHAR(50) | No | Bus type/category | V10 |
| active | BOOLEAN | No | Route active status (default TRUE) | V10 |
| created_at | TIMESTAMP | No | Creation timestamp | V11 |
| updated_at | TIMESTAMP | No | Last update timestamp | V11 |
| journey_duration_minutes | INT | No | Computed field | V6 |
| stops_count | INT | No | Denormalized count | V6 |

**Foreign Keys:**
- `from_location_id` → `locations(id)`
- `to_location_id` → `locations(id)`

**Indexes:**
- `idx_buses_locations` on (from_location_id, to_location_id)
- `idx_buses_route_lookup` on (from_location_id, to_location_id, departure_time)
- `idx_buses_name` on (name)
- `idx_buses_number` on (bus_number)
- `idx_buses_duration` on (journey_duration_minutes)
- `idx_buses_active` on (active)

---

### 2. **locations** table
**Entity:** `LocationJpaEntity.java`  
**Migration:** V1__init.sql (base), V5__add_osm_fields_to_locations.sql (OSM fields), V11__ensure_timestamps_and_final_alignment.sql (timestamps)

| Column | Type | Required | Description | Added In |
|--------|------|----------|-------------|----------|
| id | BIGINT | Yes | Primary key | V1 |
| name | VARCHAR(255) | Yes | Location name | V1 |
| latitude | DOUBLE | No | Latitude coordinate | V1 |
| longitude | DOUBLE | No | Longitude coordinate | V1 |
| osm_node_id | BIGINT | No | OpenStreetMap node ID | V5 |
| osm_way_id | BIGINT | No | OpenStreetMap way ID | V5 |
| last_osm_update | TIMESTAMP | No | Last OSM data update | V5 |
| osm_tags | JSON | No | OSM metadata | V5 |
| created_at | TIMESTAMP | No | Creation timestamp | V11 |
| updated_at | TIMESTAMP | No | Last update timestamp | V11 |

**Constraints:**
- Latitude: -90 to 90
- Longitude: -180 to 180

**Indexes:**
- `idx_locations_osm_node_id` on (osm_node_id)
- `idx_locations_osm_way_id` on (osm_way_id)
- `idx_locations_last_osm_update` on (last_osm_update)
- `idx_location_name_fulltext` FULLTEXT on (name)

---

### 3. **stops** table
**Entity:** `StopJpaEntity.java`  
**Migration:** V1__init.sql (base), V11__ensure_timestamps_and_final_alignment.sql (timestamps)

| Column | Type | Required | Description | Added In |
|--------|------|----------|-------------|----------|
| id | BIGINT | Yes | Primary key | V1 |
| name | VARCHAR(255) | Yes | Stop name | V1 |
| bus_id | BIGINT | Yes | Bus FK | V1 |
| location_id | BIGINT | Yes | Location FK | V1 |
| arrival_time | TIME | Yes | Arrival time | V1 |
| departure_time | TIME | Yes | Departure time | V1 |
| stop_order | INT | Yes | Sequence number | V1 |
| created_at | TIMESTAMP | No | Creation timestamp | V11 |
| updated_at | TIMESTAMP | No | Last update timestamp | V11 |

**Foreign Keys:**
- `bus_id` → `buses(id)`
- `location_id` → `locations(id)`

**Indexes:**
- `idx_stops_sequence` on (bus_id, stop_order)
- `idx_stops_bus_sequence` on (bus_id, stop_order)

**Constraints:**
- `stop_order >= 0`

---

### 4. **translations** table
**Entity:** `TranslationJpaEntity.java`  
**Migration:** V1__init.sql (base), V11__ensure_timestamps_and_final_alignment.sql (timestamps)

| Column | Type | Required | Description | Added In |
|--------|------|----------|-------------|----------|
| id | BIGINT | Yes | Primary key | V1 |
| entity_type | VARCHAR(50) | Yes | Entity type (location, bus, etc) | V1 |
| entity_id | BIGINT | Yes | Entity ID | V1 |
| language_code | VARCHAR(10) | Yes | Language (ta, en, etc) | V1 |
| field_name | VARCHAR(50) | Yes | Field being translated | V1 |
| translated_value | TEXT | Yes | Translation | V1 |
| created_at | TIMESTAMP | No | Creation timestamp | V11 |
| updated_at | TIMESTAMP | No | Last update timestamp | V11 |

**Unique Constraint:**
- (entity_type, entity_id, language_code, field_name)

**Indexes:**
- `idx_translations_entity` on (entity_type, entity_id)
- `idx_translations_language` on (language_code)
- `idx_translations_field` on (field_name)

---

### 5. **route_contributions** table
**Entity:** `RouteContributionJpaEntity.java`  
**Migration:** V2__create_contribution_tables.sql (initial), V10__add_missing_columns.sql (restructure)

| Column | Type | Required | Description | Added In |
|--------|------|----------|-------------|----------|
| id | VARCHAR(36) | Yes | UUID primary key | V10 |
| user_id | VARCHAR(255) | Yes | Contributor user ID | V10 |
| bus_number | VARCHAR(50) | Yes | Bus number | V2 |
| bus_name | VARCHAR(255) | No | Bus name | V10 |
| from_location_name | VARCHAR(255) | Yes | Origin name | V10 |
| to_location_name | VARCHAR(255) | Yes | Destination name | V10 |
| from_latitude | DOUBLE | No | Origin latitude | V10 |
| from_longitude | DOUBLE | No | Origin longitude | V10 |
| to_latitude | DOUBLE | No | Destination latitude | V10 |
| to_longitude | DOUBLE | No | Destination longitude | V10 |
| departure_time | VARCHAR(20) | No | Departure time string | V10 |
| arrival_time | VARCHAR(20) | No | Arrival time string | V10 |
| schedule_info | TEXT | No | Schedule details | V10 |
| status | VARCHAR(20) | Yes | PENDING/APPROVED/REJECTED | V2 |
| submission_date | TIMESTAMP | Yes | Submission timestamp | V2 |
| processed_date | TIMESTAMP | No | Processing timestamp | V10 |
| additional_notes | TEXT | No | Contributor notes | V10 |
| validation_message | TEXT | No | Validation/rejection message | V10 |
| submitted_by | VARCHAR(255) | No | Submitter name | V10 |

**Indexes:**
- `idx_route_contributions_user` on (user_id)
- `idx_route_contributions_status` on (status)
- `idx_route_contributions_bus_number` on (bus_number)
- `idx_route_contributions_submission_date` on (submission_date)

---

### 6. **image_contributions** table
**Entity:** `ImageContributionJpaEntity.java`  
**Migration:** V2__create_contribution_tables.sql (initial), V10__add_missing_columns.sql (restructure)

| Column | Type | Required | Description | Added In |
|--------|------|----------|-------------|----------|
| id | VARCHAR(36) | Yes | UUID primary key | V10 |
| user_id | VARCHAR(50) | Yes | Contributor user ID | V10 |
| description | VARCHAR(1000) | No | Image description | V10 |
| location | VARCHAR(100) | No | Location name | V10 |
| route_name | VARCHAR(100) | No | Route name | V10 |
| image_url | VARCHAR(1000) | Yes | Image URL | V2 |
| status | VARCHAR(20) | Yes | Processing status | V2 |
| submission_date | TIMESTAMP | Yes | Submission timestamp | V2 |
| processed_date | TIMESTAMP | No | Processing timestamp | V10 |
| additional_notes | VARCHAR(1000) | No | Additional notes | V10 |
| validation_message | TEXT | No | Validation message | V10 |
| extracted_data | TEXT | No | Extracted data | V10 |

**Indexes:**
- `idx_image_contributions_user` on (user_id)
- `idx_image_contributions_status` on (status)
- `idx_image_contributions_submission_date` on (submission_date)

---

### 7. **bus_timing_records** table
**Entity:** `BusTimingRecordEntity.java`  
**Migration:** V9__create_timing_tables.sql

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| bus_id | BIGINT | No | Bus FK |
| from_location_id | BIGINT | Yes | Origin location FK |
| from_location_name | VARCHAR(200) | Yes | Origin name |
| to_location_id | BIGINT | Yes | Destination location FK |
| to_location_name | VARCHAR(200) | Yes | Destination name |
| departure_time | TIME | Yes | Departure time |
| arrival_time | TIME | No | Arrival time |
| timing_type | VARCHAR(50) | Yes | MORNING/AFTERNOON/NIGHT |
| source | VARCHAR(50) | No | USER_CONTRIBUTION/OFFICIAL/OCR_EXTRACTED |
| contribution_id | BIGINT | No | Source contribution ID |
| verified | BOOLEAN | No | Verification status |
| last_updated | DATETIME | No | Last update timestamp |

**Foreign Keys:**
- `bus_id` → `buses(id)`
- `from_location_id` → `locations(id)`
- `to_location_id` → `locations(id)`

**Unique Constraint:**
- (from_location_id, to_location_id, departure_time, timing_type)

**Indexes:**
- `idx_bus_timing_from_location` on (from_location_id)
- `idx_bus_timing_to_location` on (to_location_id)
- `idx_bus_timing_departure` on (departure_time)
- `idx_bus_timing_type` on (timing_type)
- `idx_bus_timing_verified` on (verified)

---

### 8. **timing_image_contributions** table
**Entity:** `TimingImageContributionEntity.java`  
**Migration:** V9__create_timing_tables.sql

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| user_id | VARCHAR(255) | No | Contributor user ID |
| image_url | VARCHAR(500) | Yes | Image URL |
| thumbnail_url | VARCHAR(500) | No | Thumbnail URL |
| origin_location | VARCHAR(200) | Yes | Origin location |
| origin_location_tamil | VARCHAR(200) | No | Tamil translation |
| origin_latitude | DECIMAL(10,8) | No | Origin latitude |
| origin_longitude | DECIMAL(11,8) | No | Origin longitude |
| board_type | VARCHAR(50) | No | GOVERNMENT/PRIVATE/LOCAL/INTER_CITY |
| description | TEXT | No | Description |
| submission_date | DATETIME | Yes | Submission timestamp |
| status | VARCHAR(50) | Yes | PENDING/APPROVED/REJECTED/PROCESSING |
| validation_message | TEXT | No | Validation message |
| processed_date | DATETIME | No | Processing timestamp |
| processed_by | VARCHAR(100) | No | Processor ID |
| submitted_by | VARCHAR(100) | No | Submitter name |
| ocr_confidence | DECIMAL(3,2) | No | OCR confidence score |
| requires_manual_review | BOOLEAN | No | Manual review flag |
| duplicate_check_status | VARCHAR(50) | No | Duplicate check status |
| merged_records | INT | No | Count of merged records |
| created_records | INT | No | Count of created records |
| detected_language | VARCHAR(10) | No | Detected language |
| detected_languages | JSON | No | All detected languages |
| ocr_text_original | TEXT | No | Original OCR text |
| ocr_text_english | TEXT | No | English OCR text |
| created_at | DATETIME | Yes | Creation timestamp |
| updated_at | DATETIME | No | Update timestamp |

**Indexes:**
- `idx_timing_contributions_status` on (status)
- `idx_timing_contributions_submission_date` on (submission_date)
- `idx_timing_contributions_user_id` on (user_id)
- `idx_timing_contributions_origin` on (origin_location)

---

### 9. **extracted_bus_timings** table
**Entity:** `ExtractedBusTimingEntity.java`  
**Migration:** V9__create_timing_tables.sql

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| contribution_id | BIGINT | Yes | FK to timing_image_contributions |
| destination | VARCHAR(200) | Yes | Destination name |
| destination_tamil | VARCHAR(200) | No | Tamil translation |
| morning_timings | JSON | No | Morning departure times |
| afternoon_timings | JSON | No | Afternoon departure times |
| night_timings | JSON | No | Night departure times |
| created_at | DATETIME | Yes | Creation timestamp |

**Foreign Keys:**
- `contribution_id` → `timing_image_contributions(id)` ON DELETE CASCADE

**Indexes:**
- `idx_extracted_timings_contribution` on (contribution_id)
- `idx_extracted_timings_destination` on (destination)

---

### 10. **skipped_timing_records** table
**Entity:** `SkippedTimingRecordEntity.java`  
**Migration:** V9__create_timing_tables.sql

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| contribution_id | BIGINT | Yes | Source contribution ID |
| from_location_id | BIGINT | Yes | Origin location ID |
| from_location_name | VARCHAR(200) | Yes | Origin name |
| to_location_id | BIGINT | Yes | Destination location ID |
| to_location_name | VARCHAR(200) | Yes | Destination name |
| departure_time | TIME | No | Departure time |
| timing_type | VARCHAR(50) | Yes | Timing type |
| skip_reason | VARCHAR(50) | Yes | Reason for skip |
| existing_record_id | BIGINT | No | Existing record ID |
| existing_record_source | VARCHAR(50) | No | Source of existing record |
| skipped_at | DATETIME | Yes | Skip timestamp |
| processed_by | VARCHAR(100) | No | Processor ID |
| notes | TEXT | No | Additional notes |

**Indexes:**
- `idx_skipped_timing_contribution` on (contribution_id)
- `idx_skipped_timing_locations` on (from_location_id, to_location_id)
- `idx_skipped_timing_reason` on (skip_reason)

---

### 11. **user_tracking_sessions** table
**Entity:** `UserTrackingSessionEntity.java`  
**Migration:** V9__create_timing_tables.sql

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | BIGINT | Yes | Primary key |
| session_id | VARCHAR(255) | No | Session identifier |
| user_id | VARCHAR(255) | No | User identifier |
| bus_id | BIGINT | No | Tracked bus FK |
| start_location_id | BIGINT | No | Start location FK |
| end_location_id | BIGINT | No | End location FK |
| device_info | VARCHAR(500) | No | Device information |
| ip_address | VARCHAR(45) | No | IP address |
| start_time | DATETIME | No | Session start |
| end_time | DATETIME | No | Session end |
| user_agent | VARCHAR(500) | No | User agent string |

**Foreign Keys:**
- `bus_id` → `buses(id)`
- `start_location_id` → `locations(id)`
- `end_location_id` → `locations(id)`

**Indexes:**
- `idx_tracking_session` on (session_id)
- `idx_tracking_user` on (user_id)
- `idx_tracking_start_time` on (start_time)

---

## 🔍 Schema Validation Checklist

### Pre-Deployment Validation
1. ✅ Run `./gradlew clean build -x test` - must succeed
2. ✅ Check all entities have matching table definitions
3. ✅ Verify all @Column annotations match migration column names
4. ✅ Ensure all foreign key relationships are defined in both entity and migration
5. ✅ Confirm all enums in entities have VARCHAR columns in database
6. ✅ Verify JSON columns use `@JdbcTypeCode(SqlTypes.JSON)` in entities

### Common Issues and Fixes

**Issue:** `missing column [column_name] in table [table_name]`
- **Fix:** Add column to appropriate migration file OR remove field from entity

**Issue:** `Wrong column type`
- **Fix:** Ensure entity field type matches database column type:
  - String → VARCHAR/TEXT
  - Integer → INT/BIGINT
  - LocalTime → TIME
  - LocalDateTime → DATETIME/TIMESTAMP
  - Boolean → BOOLEAN/TINYINT(1)
  - Enum → VARCHAR
  - JSON fields → JSON with @JdbcTypeCode

**Issue:** `unique constraint violation`
- **Fix:** Check unique constraints in migration match @UniqueConstraint in entity

---

## 📝 Migration Order

1. V1 - Base schema (buses, locations, stops, translations)
2. V2 - Contribution tables (route_contributions, image_contributions)
3. V3 - Route contributions cleanup
4. V4 - Seed real data
5. V5 - OSM fields for locations
6. V6 - Performance indexes
7. V7 - Timing image translations
8. V8 - Route contributions indexes optimization
9. V9 - Timing tables (5 new tables)
10. V10 - Missing columns fix (buses active/capacity/category, contribution table restructure)
11. V11 - Timestamps and final alignment (created_at/updated_at for all tables)

---

## 🚀 Deployment Guidelines

### Before Pushing Code
1. Ensure build passes locally
2. Check no pending migration files
3. Verify entity-migration alignment
4. Run validation script: `backend/scripts/validate-schema-alignment.sh`

### After Deployment
1. Monitor Cloud Run logs for startup errors
2. Check Flyway migration success
3. Verify schema validation passes
4. Test API endpoints

---

## 📊 Quick Reference - Entity to Table Mapping

| Entity Class | Table Name | Primary Key Type | Key Columns |
|-------------|------------|------------------|-------------|
| BusJpaEntity | buses | BIGINT | id, bus_number, active |
| LocationJpaEntity | locations | BIGINT | id, name, latitude, longitude |
| StopJpaEntity | stops | BIGINT | id, bus_id, stop_order |
| TranslationJpaEntity | translations | BIGINT | id, entity_type, entity_id, language_code |
| RouteContributionJpaEntity | route_contributions | VARCHAR(36) | id, user_id, status |
| ImageContributionJpaEntity | image_contributions | VARCHAR(36) | id, user_id, status |
| BusTimingRecordEntity | bus_timing_records | BIGINT | id, from_location_id, to_location_id |
| TimingImageContributionEntity | timing_image_contributions | BIGINT | id, origin_location, status |
| ExtractedBusTimingEntity | extracted_bus_timings | BIGINT | id, contribution_id, destination |
| SkippedTimingRecordEntity | skipped_timing_records | BIGINT | id, contribution_id, skip_reason |
| UserTrackingSessionEntity | user_tracking_sessions | BIGINT | id, session_id, user_id |

---

**Last Updated:** November 22, 2025  
**Current Migration Version:** V11

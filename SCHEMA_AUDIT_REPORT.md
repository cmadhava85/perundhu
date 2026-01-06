# Database Schema Audit and Fixes

## Critical Issues Found and Fixed

### 1. **image_contributions table - PRIMARY KEY TYPE MISMATCH** ⚠️ CRITICAL
**Issue**: ID column declared as `INT AUTO_INCREMENT` in database but JPA entity declares `String id`
- **Location**: `V1__init.sql` line 125
- **JPA Entity**: `ImageContributionJpaEntity` - declares `@Column(name = "id", length = 36) private String id`
- **Application Code**: Generates UUID strings (36 chars) with `UUID.randomUUID().toString()`
- **Error**: "Data truncated for column 'id' at row 1" when trying to insert UUID string into INT column
- **Fix**: Migration `V54__fix_image_contributions_id_type.sql` changes ID from INT to VARCHAR(36)

### 2. **image_contributions table - COLUMN ADDITIONS**
**Issue**: Missing columns required by entity
- **JPA Entity**: `ImageContributionJpaEntity` declares:
  - `user_id` VARCHAR(50)
  - `location` VARCHAR(100)
  - `route_name` VARCHAR(100)
  - `extracted_data` TEXT
  - `image_data` LONGBLOB
  - `image_content_type` VARCHAR(100)
  - `validation_message` TEXT
  - `additional_notes` VARCHAR(1000)
  - `processed_date` TIMESTAMP
- **Status**: Added by V50__add_missing_columns_to_image_contributions.sql

---

## Schema Verification Summary

### Tables With Correct Schema Alignment

| Table | Primary Key | Status | Notes |
|-------|------------|--------|-------|
| buses | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| locations | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| stops | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| route_contributions | VARCHAR(50) | ✅ OK | Supports UUID strings (36 chars) |
| reviews | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| announcements | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| translations | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| user_feedback | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| route_issues | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| user_tracking_sessions | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| timing_image_contributions | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| extracted_bus_timings | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| skipped_timing_records | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |
| bus_timing_records | BIGINT AUTO_INCREMENT | ✅ OK | ID correctly typed |

---

## Migration Strategy

### Applied Migrations:
1. **V54__fix_image_contributions_id_type.sql** - Fixes critical ID column type mismatch
2. **V55__comprehensive_schema_audit_and_fixes.sql** - Ensures all columns have correct data types

### Key Alignments:

#### String ID Tables (UUID Support):
- `route_contributions`: VARCHAR(50) - contains UUIDs from `UUID.randomUUID().toString()`
- `image_contributions`: VARCHAR(36) - contains UUIDs from `UUID.randomUUID().toString()`

#### Auto-Increment ID Tables (BIGINT):
- All other tables use BIGINT AUTO_INCREMENT for auto-generated IDs

---

## Lessons Learned & Prevention

### Why This Error Occurred:
1. **Initial schema mismatch**: V1 created image_contributions with INT AUTO_INCREMENT
2. **Later entity change**: Entity was updated to use String ID for UUID support
3. **No schema sync**: Migrations weren't updated to match entity changes
4. **Late detection**: Error only appeared when new code tried to insert UUIDs

### Prevention Strategies:
1. **Schema-first approach**: Update entity annotations BEFORE running migrations
2. **Automated validation**: Add pre-flight checks to ensure JPA entities match DB schema
3. **Type consistency rules**:
   - Use BIGINT AUTO_INCREMENT for `@GeneratedValue(strategy = GenerationType.IDENTITY) private Long id`
   - Use VARCHAR(50+) for `private String id` when storing UUIDs
4. **Code review checklist**:
   - ✅ Entity field types match `@Column` annotations
   - ✅ `@Column` length constraints match database VARCHAR lengths
   - ✅ `@Id` type matches PRIMARY KEY column type in database
   - ✅ All new entity fields have corresponding migration columns

---

## Entity-to-Database Type Mapping Reference

### Correct Mappings:

```java
// Auto-generated numeric ID
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
// Maps to: BIGINT AUTO_INCREMENT PRIMARY KEY

// Manual UUID string ID
@Id
@Column(name = "id", length = 50)  // or 36 for exact UUID length
private String id;
// Maps to: VARCHAR(50) PRIMARY KEY or VARCHAR(36) PRIMARY KEY

// String fields with length constraints
@Column(name = "status", length = 100)
private String status;
// Maps to: VARCHAR(100)

// Large text fields
@Column(name = "description", columnDefinition = "TEXT")
private String description;
// Maps to: TEXT

// Binary data
@Lob
@Column(name = "image_data", columnDefinition = "LONGBLOB")
private byte[] imageData;
// Maps to: LONGBLOB

// Decimal numbers
@Column(name = "latitude", precision = 10, scale = 8)
private BigDecimal latitude;
// Maps to: DECIMAL(10, 8)

// Timestamps
@Column(name = "created_at")
private LocalDateTime createdAt;
// Maps to: DATETIME or TIMESTAMP

// Boolean fields
@Column(name = "is_active")
private Boolean isActive;
// Maps to: BOOLEAN or TINYINT(1)
```

---

## Validation Checklist

After applying migrations, verify:

- [ ] `image_contributions.id` is VARCHAR(36) - check with: `DESC image_contributions;`
- [ ] `image_contributions` has `image_data` LONGBLOB column
- [ ] `image_contributions` has `user_id` VARCHAR(50) column
- [ ] All route_contributions columns exist with correct types
- [ ] No data was lost during migration
- [ ] Backend can insert new image contributions with UUID strings
- [ ] No truncation errors when uploading images

---

## Files Modified

1. `/backend/app/src/main/resources/db/migration/V54__fix_image_contributions_id_type.sql` - Created
2. `/backend/app/src/main/resources/db/migration/V55__comprehensive_schema_audit_and_fixes.sql` - Created

## Impact

- **Risk Level**: Low (migrations are additive and safe)
- **Downtime**: Minimal (ALTER TABLE operations are typically fast)
- **Data Loss**: None (migrations preserve existing data)
- **Rollback**: Can revert by using previous database backup if needed

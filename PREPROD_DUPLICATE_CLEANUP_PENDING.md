# Preprod Database Duplicate Cleanup - To Be Applied

## Status: Pending

### Local Database ✅ COMPLETED
- **Removed:** 36,101 duplicate location entries
- **Before:** 62,323 total rows, 26,222 unique names, 25,725 names with duplicates
- **After:** 26,222 total rows, 26,222 unique names, 0 duplicates
- **Script:** `remove_duplicate_locations.py --apply`
- **Backup:** `deleted_duplicates_<timestamp>.txt`

### Preprod Database ⚠️ PENDING
- **Status:** Not yet applied due to authentication issues with Cloud SQL Proxy
- **Estimated duplicates:** Similar to local (~36,000+ duplicate rows)
- **Script ready:** `remove_duplicate_locations_preprod.py`

## How to Apply to Preprod

When preprod database connection is working:

```bash
# 1. Start Cloud SQL Proxy
./cloud_sql_proxy -instances=astute-strategy-406601:asia-south1:perundhu-preprod-mysql=tcp:3307 &

# 2. Dry run first
.venv/bin/python3 remove_duplicate_locations_preprod.py

# 3. Apply changes
.venv/bin/python3 remove_duplicate_locations_preprod.py --apply
```

## Authentication Issues Encountered

The preprod database connection through Cloud SQL Proxy is giving:
```
Access denied for user 'perundhu_user'@'cloudsqlproxy~...' (using password: YES)
```

**Possible causes:**
1. Password in Secret Manager (`db-password`) may have changed
2. User `perundhu_user` may need to be recreated on the instance
3. User may lack required permissions

**Previous successful connection:**
- Earlier in this session, we successfully ran `update_location_names.py` on preprod
- That connection used the same credentials and proxy setup
- The issue may be intermittent or related to IP allowlisting

## What Needs to Happen

1. **Fix preprod authentication** (see CD_PIPELINE_DATABASE_AUTH_FIX.md)
2. **Run the duplicate removal script** on preprod
3. **Verify results** - should remove ~36,000+ duplicates
4. **Test autocomplete** - should no longer show duplicate entries

## Impact

**Until preprod duplicates are removed:**
- Preprod autocomplete will still show duplicate location entries
- Users will see repeated location names in dropdowns
- Database queries will be slower due to extra rows
- More storage used than necessary

**After removal:**
- Clean, deduplicated location data
- Faster autocomplete queries
- Better user experience
- ~58% reduction in location table size (from ~62k to ~26k rows)

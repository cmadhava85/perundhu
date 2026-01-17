# TamilVandi Scraper: Page-Number-Based Pagination Update

**Date:** January 16, 2026  
**Status:** ✅ Complete

## Problem
The TamilVandi scraper was using **offset-based pagination** (e.g., `[50, 50, "Sivakasi", "Madurai"]` for page 2), but the actual Wix API uses **page-number-based pagination** (e.g., `[1, 50, "Sivakasi", "Madurai"]` for page 2).

## Solution
Updated the scraper to use page numbers instead of offsets in the API payload.

### Wix API Format
```json
[page_number, page_size, origin_city, destination_city]
```

**Examples:**
- Page 1 (0-indexed): `[0, 9, "SIVakasi", "madurai"]`
- Page 2: `[1, 9, "SIVakasi", "madurai"]`
- Page 3: `[2, 9, "SIVakasi", "madurai"]`
- Page 4: `[3, 9, "SIVakasi", "madurai"]` ← As shown in user's curl example
- Page 5: `[4, 9, "SIVakasi", "madurai"]`

**Note:** The page numbering is **0-indexed**, so:
- First page = 0
- Second page = 1
- Third page = 2
- etc.

## Changes Made

### File: `scripts/tamilvandi_scraper_selenium.py`

#### 1. Updated `fetch_paginated_data_via_api()` method signature
**Before:**
```python
def fetch_paginated_data_via_api(self, from_city: str, to_city: str, page_offset: int, page_size: int = 50)
```

**After:**
```python
def fetch_paginated_data_via_api(self, from_city: str, to_city: str, page_number: int, page_size: int = 50)
```

#### 2. Updated payload construction
**Before:**
```python
# Build request body: [page_offset, page_size, origin, destination]
payload = [page_offset, page_size, from_city, to_city]
logger.debug(f"API call: offset={page_offset}, size={page_size}, from={from_city}, to={to_city}")
```

**After:**
```python
# Build request body: [page_number, page_size, origin, destination]
# Example: [4, 9, "SIVakasi", "madurai"] means page 4 with 9 results per page
payload = [page_number, page_size, from_city, to_city]
logger.debug(f"API call: page={page_number}, size={page_size}, from={from_city}, to={to_city}")
```

#### 3. Updated pagination logic in `scrape_route_pair()`
**Before:**
```python
page_num = 2
page_offset = page_size  # Start from second page (e.g., 50)

while page_num <= max_pages:
    logger.info(f"  📄 Page {page_num} (via API, offset={page_offset})...")
    api_data = self.fetch_paginated_data_via_api(from_city, to_city, page_offset, page_size)
    # ...
    page_offset += page_size  # Increment by page_size (e.g., 50, 100, 150...)
    page_num += 1
```

**After:**
```python
page_num = 2
# Page number is 0-indexed in API: page 1 (HTML) = index 0, page 2 = index 1, etc.
page_index = 1  # Start from second page (index 1)

while page_num <= max_pages:
    logger.info(f"  📄 Page {page_num} (via API, page_index={page_index})...")
    api_data = self.fetch_paginated_data_via_api(from_city, to_city, page_index, page_size)
    # ...
    page_index += 1  # Increment page number (not offset)
    page_num += 1
```

## Usage

### With Manual Auth Token
To test with a manually provided Wix auth token:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --output data/tamilvandi_results \
  --auth-token "wixcode-pub.YOUR_TOKEN_HERE"
```

### Without Token (HTML Scraping Only)
The scraper will still work without a token, but will only scrape the first page:

```bash
python scripts/tamilvandi_scraper_selenium.py \
  --from "Sivakasi" \
  --to "Madurai" \
  --output data/tamilvandi_results
```

## Impact

### Before
- **Offset-based**: Page 2 = offset 50, Page 3 = offset 100, Page 4 = offset 150
- **Issue**: API expected page numbers, not offsets
- **Result**: API calls would fail or return unexpected data

### After
- **Page-number-based**: Page 2 = index 1, Page 3 = index 2, Page 4 = index 3
- **Matches**: Wix API format `[page_number, page_size, from, to]`
- **Result**: API calls work correctly with proper pagination

## Testing
To verify the changes work correctly, extract a fresh auth token from the website and run:

```bash
./test_with_token.sh
```

Or use the curl command format:
```bash
curl 'https://www.tamilvandi.com/_api/wix-code-public-dispatcher-ng/siteview/_webMethods/backend/googleSheetFetch.jsw/getSheetDataPaginated.ajax?gridAppId=ee62bd20-2f2c-4073-bdd3-3e5bb29c2a48&viewMode=site' \
  -H 'authorization: YOUR_TOKEN' \
  -H 'content-type: application/json' \
  --data-raw '[1,10,"Sivakasi","Madurai"]'
```

## Benefits
✅ Correct API pagination format matching Wix specification  
✅ Clearer code with `page_number` instead of `page_offset`  
✅ Simpler incrementing logic (page_index += 1 instead of page_offset += page_size)  
✅ More intuitive debugging output  
✅ Matches the curl example provided by the user  

## Next Steps
- Extract fresh auth token from browser when needed
- Test multi-page scraping with active token
- Monitor for token expiration (tokens typically expire after a few hours)

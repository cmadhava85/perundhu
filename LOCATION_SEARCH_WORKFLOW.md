# 🔍 Location Search Workflow: Text → ID

## Flow: How Search Actually Works

```
USER TYPES: "besant nagar"
    ↓
FRONTEND SENDS: /api/locations/search?q=besant%20nagar
    ↓
BACKEND SEARCHES: 
    SELECT id, name, type, display_name, display_priority 
    FROM locations 
    WHERE search_text LIKE '%besant nagar%'
    ORDER BY display_priority ASC
    ↓
BACKEND RETURNS:
[
  {
    "id": 1001,
    "name": "Besant Nagar MTC Terminus",
    "type": "bus_stop",
    "display_name": "🚌 Besant Nagar MTC Terminus - Chennai",
    "display_priority": 1
  },
  {
    "id": 1002,
    "name": "Besant Nagar",
    "type": "neighborhood",
    "display_name": "📍 Besant Nagar Area - Chennai",
    "display_priority": 31
  }
]
    ↓
FRONTEND DISPLAYS: 
  🚌 Besant Nagar MTC Terminus - Chennai
  📍 Besant Nagar Area - Chennai
    ↓
USER CLICKS on option
    ↓
FORM SUBMITS: location_id = 1001
```

---

## Backend API Endpoint

**Python (Flask/FastAPI example):**

```python
@app.get("/api/locations/search")
def search_locations(q: str, limit: int = 20):
    """Search locations by text"""
    
    search_query = f"%{q.lower()}%"
    
    results = db.execute("""
        SELECT 
            id, 
            name, 
            type, 
            display_name, 
            display_priority,
            district,
            state
        FROM locations
        WHERE search_text LIKE ?
        ORDER BY display_priority ASC, name ASC
        LIMIT ?
    """, (search_query, limit)).fetchall()
    
    return {
        "results": [
            {
                "id": row['id'],
                "name": row['name'],
                "type": row['type'],
                "display_name": row['display_name'],
                "district": row['district'],
                "state": row['state']
            }
            for row in results
        ]
    }
```

---

## Frontend Implementation

```javascript
// React component
import { useState } from 'react';

export function LocationDropdown() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const handleSearch = async (query) => {
    setSearchTerm(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }

    // TEXT-BASED SEARCH (not ID-based)
    const response = await fetch(
      `/api/locations/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data.results);  // Array of location objects with IDs
  };

  const handleSelect = (locationId) => {
    setSelectedId(locationId);
    // Submit form with ID
  };

  return (
    <div>
      <input
        placeholder="Search locations..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <ul>
        {results.map((location) => (
          <li 
            key={location.id}
            onClick={() => handleSelect(location.id)}
          >
            {/* Display the nice format */}
            {location.display_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## The Key Points

**Search is TEXT-BASED:**
- User types text: "besant nagar"
- Database searches WHERE `search_text` LIKE '%besant nagar%'
- Returns all matching locations with their IDs

**Results Include ID:**
- Each search result has an `id` field
- When user clicks a result, that `id` is used
- Form submits with the `id`

**Order of Operations:**
1. Text search → Find matching records → Return with IDs
2. Display results using `display_name` field
3. Store the `id` when user selects

---

## Complete Data Flow Example

**Database Record (Single):**
```sql
INSERT INTO locations VALUES (
  1001,
  'Besant Nagar MTC Terminus',    -- name (raw)
  'bus_stop',                      -- type
  13.0003485,                      -- latitude
  80.2657764,                      -- longitude
  'Chennai',                       -- district
  'Tamil Nadu',                    -- state
  11906447555,                     -- osm_id
  
  'besant nagar mtc terminus bus stop chennai',  -- search_text (searchable)
  '🚌 Besant Nagar MTC Terminus - Chennai',     -- display_name (UI display)
  'bus_stop',                                    -- display_type
  1                                             -- display_priority (sorting)
);
```

**Search Query (User types "besant"):**
```sql
WHERE search_text LIKE '%besant%'
-- Matches: 'besant nagar mtc terminus bus stop chennai' ✅
```

**Search Results (What API returns):**
```json
{
  "id": 1001,                                    -- ← THIS ID
  "name": "Besant Nagar MTC Terminus",
  "display_name": "🚌 Besant Nagar MTC Terminus - Chennai",
  "display_priority": 1
}
```

**Form Submission (After user clicks):**
```
POST /api/bookings
{
  "location_id": 1001  -- ← Use the ID
}
```

---

## Summary

**Not ID-based search:**
- Don't search by typing IDs
- Users type location names

**Text-based search:**
- User types: "besant nagar"
- Backend searches `search_text` field
- Returns matching records with their IDs
- Frontend displays using `display_name`
- Form submits the `id`

Ready for me to create the full transformation script and backend API endpoints?

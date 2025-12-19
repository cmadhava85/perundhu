# TNSTC Bus Route Scraper

This folder contains Playwright scripts to scrape bus route data from the TNSTC (Tamil Nadu State Transport Corporation) website.

## Scripts

### 1. `inspect-tnstc-site.ts` - Website Inspector

First, run this to understand the website structure:

```bash
cd frontend
npx ts-node scripts/tnstc-scraper/inspect-tnstc-site.ts
```

This will:
- Open the TNSTC website in a browser
- Capture screenshots at each step
- Analyze form elements, inputs, and selectors
- Save network requests for API discovery
- Output everything to `./scraped-data/inspection/`

### 2. `scrape-tnstc-routes.ts` - Route Scraper

After inspecting, run the main scraper:

```bash
cd frontend
npx ts-node scripts/tnstc-scraper/scrape-tnstc-routes.ts
```

Configuration options in the script:
```typescript
const config = {
  sourceCity: 'CHENNAI',           // Starting point
  destinationCities: 'ALL',        // or ['MADURAI', 'COIMBATORE']
  delayBetweenRequests: 3000,      // Be respectful to the server
  maxDestinations: 10,             // Limit for testing
  headless: false,                 // Set true for background
  outputDir: './scraped-data',
};
```

## Output Format

### JSON Structure
```json
{
  "source": "CHENNAI",
  "totalRoutes": 5,
  "totalBuses": 150,
  "scrapedAt": "2025-12-19T10:00:00.000Z",
  "routes": [
    {
      "source": "CHENNAI",
      "destination": "MADURAI",
      "buses": [
        {
          "busNumber": "SETC-123",
          "busType": "Ultra Deluxe",
          "departureTime": "08:00",
          "arrivalTime": "14:30",
          "duration": "6h 30m",
          "fare": "₹450",
          "viaStops": ["Villupuram", "Trichy"],
          "stopDetails": [
            {
              "stopName": "Villupuram",
              "arrivalTime": "10:00",
              "departureTime": "10:10",
              "stopOrder": 1
            }
          ]
        }
      ]
    }
  ]
}
```

## Importing to Perundhu

The scraped data can be imported into Perundhu using:
1. The admin API endpoint `/api/v1/admin/import/buses`
2. Manual database migration scripts
3. The contribution form (for individual routes)

## Ethical Considerations

⚠️ **Use Responsibly:**
- Add appropriate delays between requests (3-5 seconds)
- Don't run during peak hours
- This is for personal/educational data collection
- Consider reaching out to TNSTC for official data partnership

## Troubleshooting

### Selectors not working
The website structure may change. Run `inspect-tnstc-site.ts` first to get updated selectors.

### CAPTCHA blocking
If CAPTCHA appears, you may need to solve it manually. The script will wait.

### IP blocking
If blocked, wait 24 hours or use a different network.

## Dependencies

Already installed in the frontend:
- `playwright` - Browser automation
- `typescript` - Type safety

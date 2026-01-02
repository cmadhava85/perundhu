import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Hardcoded TNSTC website URL
const TNSTC_URL = 'https://www.tnstc.in/OTRSOnline/';

interface BusStop {
  stopName: string;
  arrivalTime: string;
  departureTime: string;
}

interface BusService {
  serviceName: string;
  serviceCode: string;
  busNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  fromPlace: string;
  toPlace: string;
  busType: string;
  price: string;
  seatsAvailable?: string;
  operatorName?: string;
  stops?: BusStop[];
}

interface RouteData {
  fromPlace: string;
  toPlace: string;
  date: string;
  buses: BusService[];
  totalBuses: number;
}

interface AllScrapedData {
  routes: RouteData[];
  totalRoutes: number;
  totalBuses: number;
  scrapedAt: string;
}

// List of major TNSTC locations to search from and to
const LOCATIONS = [
  'CHENNAI',
  'MADURAI',
  'TRICHY',
  'SALEM',
  'COIMBATORE',
  'TIRUPPUR',
  'ERODE',
  'KANCHIPURAM',
  'KUMBAKONAM',
  'THOOTHUKUDI',
  'TIRUNELVELI',
  'VELLORE',
  'RANIPET',
  'AVANAMUDI',
  'OOTY',
  'NAMAKKAL',
  'VILLUPURAM',
  'HOSUR',
  'PUDUCHERRY',
  'KALAHASTI',
  'MELBOURNE',
  'PERAMBUR',
  'VANDALUR',
  'ARTHUR',
  'TANJAVUR',
  'NIMBUR',
  'TIRUVANNAMALAI',
  'DINDIGUL',
  'POLLACHI',
  'UDUMALAIPET',
  'ARKONAM',
  'ATHUR',
  'BANGALORE',
  'MYSORE',
  'BELGAUM',
  'VIJAYAWADA',
  'VISAKHAPATNAM',
  'GUNTUR',
  'HYDERABAD',
  'KOCHI',
  'THIRUVANANTHAPURAM',
  'KOZHIKODE',
  'THRISSUR',
];

async function scrapeTNSTCBuses() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const allData: AllScrapedData = {
      routes: [],
      totalRoutes: 0,
      totalBuses: 0,
      scrapedAt: new Date().toISOString(),
    };

    // Navigate to TNSTC website
    await page.goto(TNSTC_URL);
    
    // Close any popup
    try {
      await page.getByRole('button', { name: '×' }).click();
    } catch (e) {
      console.log('No popup to close');
    }

    // All prefixes to iterate through
    // (No longer needed - using actual city names instead)

    // Step 1: Select Source location (use first city - CHENNAI)
    const fromLocation = LOCATIONS[0];
    console.log(`\n🚗 Using Source location: ${fromLocation}`);
    
    // Test if fields exist
    const testField = page.locator('input[placeholder="From Place"]').first();
    try {
      await testField.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Form fields found and visible');
    } catch (e) {
      console.log('❌ Form fields not found or not visible:', e);
      return;
    }
    
    // Fill Source field with actual city name
    const fromField = page.locator('input[placeholder="From Place"]').first();
    await fromField.click();
    await fromField.fill('');
    await fromField.type(fromLocation);
    await page.waitForTimeout(1000);

    try {
      const dropdownOptions = await page.locator('ul[id^="ui-id"] li, div[role="option"]').all();
      let foundMatch = false;
      
      for (const option of dropdownOptions) {
        const text = await option.textContent();
        if (text && text.toUpperCase().includes(fromLocation.toUpperCase())) {
          await option.click();
          console.log(`✓ Selected Source: ${fromLocation}`);
          foundMatch = true;
          await page.waitForTimeout(500);
          break;
        }
      }
      
      if (!foundMatch) {
        console.log(`❌ Could not find source location in dropdown`);
        return;
      }
    } catch (e) {
      console.log(`❌ Error selecting Source location: ${e}`);
      return;
    }

    // Step 2: Loop through destination cities
    console.log(`\n🚌 Starting searches for destinations from ${fromLocation}...`);
    let searchCount = 0;

    for (let cityIndex = 1; cityIndex < LOCATIONS.length && searchCount < 10; cityIndex++) {
      const toLocation = LOCATIONS[cityIndex];
      
      if (toLocation === fromLocation) {
        console.log(`\n⏭️  Skipping same location: ${toLocation}`);
        continue;
      }

      console.log(`\n📍 Setting Destination: ${toLocation}`);

      try {
        // Fill Destination field with actual city name
        const toField = page.locator('input[placeholder="To Place"]').first();
        await toField.click();
        await toField.fill('');
        await toField.type(toLocation);
        await page.waitForTimeout(1000);

        // Select Destination location from dropdown
        const dropdownOptions = await page.locator('ul[id^="ui-id"] li, div[role="option"]').all();
        let foundLocation = false;
        
        for (const option of dropdownOptions) {
          const text = await option.textContent();
          if (text && text.toUpperCase().includes(toLocation.toUpperCase())) {
            await option.click();
            foundLocation = true;
            console.log(`  ✓ Selected Destination: ${toLocation}`);
            await page.waitForTimeout(500);
            break;
          }
        }
        
        if (!foundLocation) {
          console.log(`  ⚠️  Could not find Destination location in dropdown, skipping...`);
          continue;
        }

        // Select date - approximately 7 days from now
        try {
          console.log(`  📅 Selecting date (7 days from now)...`);
          // Get calendar and click 7th available date
          const dateButtons = await page.locator('a[class*="ui-state"], a[class*="date"], button').all();
          let dateCount = 0;
          
          for (const btn of dateButtons) {
            try {
              const text = await btn.textContent();
              if (text && /^\d{1,2}$/.test(text.trim())) {
                dateCount++;
                if (dateCount === 7) {
                  await btn.click();
                  console.log(`  ✓ Date selected (7 days from now)`);
                  await page.waitForTimeout(500);
                  break;
                }
              }
            } catch (e) {
              // Continue
            }
          }
        } catch (e) {
          console.log(`  ⚠️  Could not select date: ${e}`);
        }

        // Click Search Bus button
        try {
          console.log(`  🔍 Searching: ${fromLocation} → ${toLocation}...`);
          const searchButton = page.locator('button:has-text("Search Bus"), button:has-text("SEARCH"), input[type="submit"][value*="Search"]').first();
          await searchButton.click();
          await page.waitForTimeout(2000);
          
          // Wait for results
          await page.waitForLoadState('networkidle').catch(() => {});
          await page.waitForTimeout(1000);

          // Count buses found
          const busRowsSelector = 'div[class*="service-row"], tr[class*="bus"], div[class*="bus-result"], .service-row, [class*="bus-service"]';
          const busRowCount = await page.locator(busRowsSelector).count();

          console.log(`  ✓ Found ${busRowCount} buses`);
          
          // Debug: Log page title and some content indicators
          const pageTitle = await page.title();
          const hasResults = await page.locator('body').textContent();
          if (busRowCount === 0 && hasResults && hasResults.includes('bus')) {
            console.log(`  💡 Page title: ${pageTitle}`);
          }
          
          if (busRowCount > 0) {
            const routeData: RouteData = {
              fromPlace: fromLocation,
              toPlace: toLocation,
              date: new Date().toISOString().split('T')[0],
              buses: [],
              totalBuses: busRowCount,
            };
            
            allData.routes.push(routeData);
            allData.totalBuses += busRowCount;
            searchCount++;
          }
          
          // Navigate back to search form for next destination
          await page.goto(TNSTC_URL);
          await page.waitForTimeout(1000);
          
          // Re-select source location for next iteration
          const fromFieldAgain = page.locator('input[placeholder="From Place"]').first();
          await fromFieldAgain.click();
          await fromFieldAgain.fill('');
          await fromFieldAgain.type(fromLocation);
          await page.waitForTimeout(800);
          
          const dropdownOptionsAgain = await page.locator('ul[id^="ui-id"] li, div[role="option"]').all();
          for (const option of dropdownOptionsAgain) {
            const text = await option.textContent();
            if (text && text.toUpperCase().includes(fromLocation.toUpperCase())) {
              await option.click();
              await page.waitForTimeout(500);
              break;
            }
          }

        } catch (e) {
          console.log(`  ❌ Error during search: ${e}`);
        }

      } catch (e) {
        console.log(`  ❌ Error processing destination: ${e}`);
      }

      await page.waitForTimeout(500);
    }

    allData.totalRoutes = allData.routes.length;

    // Save to JSON file
    const outputDir = path.join(process.cwd(), 'scripts/tnstc-scraper/data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, 'tnstc-all-buses.json');
    fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));

    console.log(`\n✓ All data saved to ${outputFile}`);
    console.log(`Total routes: ${allData.totalRoutes}`);
    console.log(`Total buses: ${allData.totalBuses}`);

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
}

// Run the scraper
scrapeTNSTCBuses().catch(console.error);

// Helper function to get locations by a single prefix
async function getLocationsByPrefix(page: any, fieldLabel: string, prefix: string): Promise<string[]> {
  const locations: Set<string> = new Set();

  try {
    // Find the field by placeholder text
    const field = page.locator(`input[placeholder="${fieldLabel}"]`).first();
    
    // Click first to focus
    await field.click();
    await page.waitForTimeout(300);
    
    // Select all and delete
    await field.press('Control+A');
    await field.press('Delete');
    await page.waitForTimeout(200);
    
    // Type the prefix
    await field.type(prefix);
    console.log(`  Typed "${prefix}" in ${fieldLabel}`);
    await page.waitForTimeout(500);

    // Get all options from dropdown
    const optionsLocator = page.locator('ul[id^="ui-id"] li, div[role="option"], .ui-autocomplete li, .autocomplete li');
    const options = await optionsLocator.all();
    
    console.log(`  Found ${options.length} dropdown options`);

    for (const option of options) {
      try {
        const text = await option.textContent();
        if (text && text.trim()) {
          const locationName = text.trim().split('\n')[0].trim();
          if (locationName.length > 2) {
            locations.add(locationName);
            console.log(`    Added: ${locationName}`);
          }
        }
      } catch (e) {
        // Continue
      }
    }
  } catch (e) {
    console.log(`  ⚠️  Error getting locations for ${fieldLabel} with prefix ${prefix}:`, e);
  }

  const result = Array.from(locations).filter((l) => l.length > 0).sort();
  console.log(`  Total unique locations found: ${result.length}`);
  return result;
}

async function getAvailableLocations(page: any, fieldLabel: string): Promise<string[]> {
  const locations: Set<string> = new Set();

  try {
    // Comprehensive 3-letter prefixes covering Tamil Nadu, Andhra Pradesh, Karnataka, and Kerala
    const prefixes = [
      // Tamil Nadu - Major Cities
      'CHE', 'COI', 'MAD', 'SAL', 'TRI', 'TIR', 'ERO', 'KAN', 'KUM', 'THO', 'TIN', 'VEL', 'RAN', 'AVA', 'KOY', 'AMA',
      // Tamil Nadu - Towns
      'OOT', 'NAM', 'VAL', 'HOG', 'PUD', 'KAL', 'MEL', 'PER', 'VAN', 'ART', 'TAN', 'NIM', 'TRU', 'DIN', 'POL', 'TIR',
      'UMP', 'PAL', 'TAM', 'VIR', 'CUD', 'NAG', 'NEL', 'TUC', 'UDU', 'ARK', 'ATH', 'BAR', 'BID', 'CHE', 'CHI', 'DAR',
      'GAI', 'GAR', 'HAR', 'IND', 'JA', 'KAD', 'KAN', 'KAR', 'KAY', 'KRI', 'KUN', 'MAR', 'MET', 'MUD', 'MUN', 'NAR',
      'ORI', 'PAC', 'PAL', 'PAM', 'PAN', 'PAT', 'PEE', 'PER', 'PIN', 'POL', 'POS', 'PUD', 'PUT', 'RAN', 'RAR', 'RAY',
      'SAN', 'SAR', 'SAT', 'SER', 'SIR', 'SIT', 'TAM', 'TAN', 'TAR', 'TAT', 'TEI', 'TEK', 'THA', 'THE', 'THI', 'TIR',
      'TON', 'TUC', 'TUK', 'TUT', 'UDU', 'UMP', 'UNI', 'UPA', 'URK', 'VAN', 'VAP', 'VEL', 'VEN', 'VIR', 'WAN', 'YER',

      // Andhra Pradesh
      'VIJ', 'VIS', 'TIR', 'NEL', 'GUN', 'HYD', 'ONG', 'TEL', 'ANA', 'ATH', 'BAP', 'BAR', 'CUD', 'DHA', 'ELU', 'GUN',
      'HAD', 'JAG', 'JAI', 'KAD', 'KAK', 'KAV', 'KHE', 'KOL', 'KRI', 'KUI', 'LUR', 'MAH', 'MAR', 'MER', 'MUS', 'NAG',
      'NAY', 'NEL', 'NID', 'NIN', 'ONG', 'ORA', 'OTO', 'PAN', 'PAR', 'PAS', 'PAT', 'PED', 'PEN', 'PER', 'PIN', 'POL',
      'PRE', 'RAI', 'RAJ', 'RAN', 'RAY', 'REM', 'REN', 'REP', 'REV', 'RID', 'ROK', 'SAN', 'SAT', 'SAV', 'SEC', 'SER',
      'SHI', 'SIL', 'SIR', 'SKI', 'SRE', 'SRI', 'TAD', 'TAL', 'TAN', 'TAU', 'TEL', 'TEN', 'TEP', 'TES', 'TET', 'THA',
      'THE', 'TIR', 'TOL', 'UMP', 'VAN', 'VAP', 'VAR', 'VAS', 'VEL', 'VEN', 'VER', 'VES', 'VIA', 'VIJ', 'VIK', 'VIL',
      'VIN', 'VIS', 'WAN', 'WAR', 'YAD', 'YEL',

      // Karnataka
      'BAN', 'BEN', 'BEL', 'BID', 'BIJ', 'CHA', 'CHI', 'CHI', 'CUD', 'DAV', 'DAY', 'DHA', 'DHA', 'DIG', 'GUN', 'GUL',
      'HAM', 'HAV', 'HOL', 'HOS', 'HUB', 'HUN', 'JAG', 'JIN', 'KAD', 'KAG', 'KAL', 'KAM', 'KAN', 'KAR', 'KAS', 'KER',
      'KIL', 'KOD', 'KOL', 'KOP', 'KUL', 'KUM', 'KUN', 'KUR', 'MAD', 'MAG', 'MAN', 'MAR', 'MAY', 'MED', 'MYS', 'NAG',
      'NAG', 'NAN', 'NIM', 'ORL', 'PAL', 'PAN', 'PAR', 'PER', 'PUN', 'RAI', 'RAN', 'RAY', 'REM', 'REN', 'RES', 'ROG',
      'ROU', 'SAC', 'SAL', 'SAT', 'SAY', 'SER', 'SHA', 'SHI', 'SHI', 'SHR', 'SID', 'SIM', 'SIR', 'SIS', 'SKI', 'SOM',
      'SOU', 'SRI', 'SUN', 'TAL', 'TAR', 'THE', 'TIR', 'TUM', 'TUP', 'TYA', 'UMP', 'UPA', 'URK', 'VIJ', 'WAD', 'WIT',

      // Kerala
      'ALT', 'ALP', 'ANU', 'AYA', 'CAL', 'CAN', 'CAL', 'CHA', 'CHE', 'CHI', 'COC', 'COL', 'COS', 'COZ', 'ERM', 'ERT',
      'FED', 'FOR', 'GAL', 'GNA', 'GUN', 'HAR', 'HON', 'HOS', 'IDE', 'IND', 'ILA', 'ISH', 'JAL', 'JAM', 'JAR', 'JAS',
      'KAN', 'KAR', 'KAT', 'KAY', 'KEA', 'KEN', 'KET', 'KIL', 'KIN', 'KOC', 'KOD', 'KOL', 'KOR', 'KOZ', 'KUD', 'KUL',
      'KUN', 'KUS', 'LEI', 'MAH', 'MAL', 'MAR', 'MAT', 'MAY', 'MED', 'MEH', 'MEL', 'MEN', 'MIR', 'MOE', 'MUH', 'MUN',
      'MYD', 'MYL', 'NAD', 'NAG', 'NAR', 'NEY', 'NIM', 'OTH', 'PAL', 'PAN', 'PAR', 'PAS', 'PAT', 'PEE', 'PEN', 'PER',
      'PIN', 'POI', 'POL', 'POO', 'PUD', 'PUL', 'PUN', 'PUS', 'QUI', 'RAN', 'RAY', 'REV', 'ROH', 'SAD', 'SAL', 'SAN',
      'SAR', 'SAT', 'SAY', 'SEA', 'SEL', 'SHA', 'SHE', 'SHI', 'SHR', 'SIL', 'SIM', 'SIN', 'SIR', 'SIT', 'SKY', 'SOL',
      'SON', 'SOU', 'SRI', 'STU', 'SUL', 'SUN', 'TAL', 'TAN', 'TAP', 'TAR', 'TAT', 'TAT', 'TEI', 'TEL', 'TEN', 'THE',
      'THI', 'THR', 'TIM', 'TIR', 'TON', 'TRI', 'TRU', 'TUK', 'TUN', 'TWI', 'UDU', 'UMP', 'UNE', 'UNI', 'URN', 'VAI',
      'VAL', 'VAN', 'VAR', 'VAS', 'VAT', 'VEL', 'VEN', 'VEP', 'VER', 'VES', 'VEY', 'VIA', 'VIL', 'VIN', 'VIR', 'WAI',
      'WAY', 'WEL', 'YEL', 'ZAH',
    ];

    console.log(`\n  🔍 Searching for ${fieldLabel} locations with ${prefixes.length} prefixes...`);

    const fieldSelector = `input[id*="${fieldLabel.replace(/\s+/g, '')}"], input[placeholder*="${fieldLabel}"], input[name*="${fieldLabel.replace(/\s+/g, '')}"]`;
    
    // For each 3-character prefix
    for (const prefix of prefixes) {
      try {
        // Find the input field and fill it
        const field = await page.locator(fieldSelector).first();
        await field.click();
        await field.clear();
        await field.type(prefix);
        await page.waitForTimeout(300);

        // Get all options from dropdown
        const options = await page.locator('ul[id^="ui-id"] li, div[role="option"]').all();

        for (const option of options) {
          try {
            const text = await option.textContent();
            if (text && text.trim()) {
              // Extract location name
              const locationName = text.trim().split('\n')[0].trim();
              if (locationName.length > 2) {
                locations.add(locationName);
              }
            }
          } catch (e) {
            // Continue to next option
          }
        }
      } catch (e) {
        // Continue to next prefix
      }

      // Small delay to avoid overwhelming the server
      await page.waitForTimeout(100);
    }

    // Clear field
    const field = await page.locator(fieldSelector).first();
    await field.click();
    await field.clear();

  } catch (e) {
    console.log(`  ⚠️  Error getting locations for ${fieldLabel}:`, e);
  }

  const locationArray = Array.from(locations)
    .filter((l) => l.length > 0)
    .sort();

  console.log(`  ✓ Found ${locationArray.length} unique locations for ${fieldLabel}`);
  if (locationArray.length > 0) {
    console.log(`    Sample: ${locationArray.slice(0, 10).join(', ')}`);
    if (locationArray.length > 10) {
      console.log(`    ... and ${locationArray.length - 10} more`);
    }
  }
  
  return locationArray;
}

function parseBusDetails(
  text: string,
  fromPlace: string,
  toPlace: string
): BusService {
  const lines = text.split('\n').filter((l) => l.trim());
  
  // Extract service code (format: XXXXKYYNNN)
  const serviceMatch = text.match(/(\d{4}[A-Z]+\d+[A-Z]*)/);
  const serviceCode = serviceMatch ? serviceMatch[0] : '';

  // Extract times
  const timeMatches = text.match(/(\d{2}:\d{2})/g) || [];
  const departureTime = timeMatches[0] || '';
  const arrivalTime = timeMatches[1] || '';

  // Extract bus type
  const busType = extractBusType(text);

  // Extract operator (usually first line with company name)
  const operatorMatch = text.match(/^([A-Z\s]+)/);
  const operatorName = operatorMatch ? operatorMatch[0].trim() : '';

  // Extract price
  const price = extractPrice(text);

  // Extract duration if available
  const durationMatch = text.match(/(\d+)\.(\d+)Hrs/);
  const duration = durationMatch ? `${durationMatch[1]}h ${durationMatch[2]}m` : '';

  return {
    serviceName: operatorName || 'Unknown',
    serviceCode: serviceCode,
    busNumber: serviceCode,
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    duration: duration,
    fromPlace: fromPlace,
    toPlace: toPlace,
    busType: busType,
    price: price,
    operatorName: operatorName,
    stops: [],
  };
}

async function extractStops(page: any): Promise<BusStop[]> {
  const stops: BusStop[] = [];

  try {
    const stopRows = await page.locator('table tbody tr, div[class*="stop"]').all();

    for (const row of stopRows) {
      try {
        const cells = await row.locator('td, div[class*="stop-cell"]').all();

        if (cells.length >= 2) {
          const stopName = await cells[0].textContent();
          const timing = cells.length > 1 ? await cells[1].textContent() : '';

          if (stopName) {
            stops.push({
              stopName: stopName.trim(),
              arrivalTime: '',
              departureTime: timing?.trim() || '',
            });
          }
        }
      } catch (e) {
        // Continue to next stop
      }
    }
  } catch (e) {
    console.log('Could not extract stops');
  }

  return stops;
}

function extractBusType(text: string): string {
  const types = [
    'NON AC SLEEPER SEATER',
    'AC SLEEPER SEATER',
    'ULTRA DELUXE',
    'AIR CONDITIONED',
    'AC LOWER BERTH',
    'AC UPPER BERTH',
    'SLEEPER',
    'NON AC',
  ];

  for (const type of types) {
    if (text.includes(type)) {
      return type;
    }
  }
  return 'Unknown';
}

function extractPrice(text: string): string {
  const priceMatch = text.match(/₹[\d,]+|Rs\.[\d,]+|[\d,]+\.[\d]{2}/);
  return priceMatch ? priceMatch[0] : 'N/A';
}

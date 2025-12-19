/**
 * TNSTC Bus Route Scraper
 * 
 * This script uses Playwright to scrape bus route data from the TNSTC website.
 * It collects:
 * - Bus numbers
 * - Departure/Arrival times
 * - Source and Destination
 * - Via stops with timings
 * 
 * Usage:
 *   npx ts-node scripts/tnstc-scraper/scrape-tnstc-routes.ts
 * 
 * Or with npx playwright:
 *   npx playwright test scripts/tnstc-scraper/scrape-tnstc-routes.ts --headed
 * 
 * DISCLAIMER: Use responsibly with appropriate delays. 
 * This is for personal/educational data collection only.
 */

import { chromium } from 'playwright';
import type { Page, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TYPES
// ============================================

interface StopDetail {
  stopName: string;
  arrivalTime: string;
  departureTime: string;
  stopOrder: number;
}

interface BusRoute {
  busNumber: string;
  busType: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  fare: string;
  viaStops: string[];
  stopDetails: StopDetail[];
  scrapedAt: string;
}

interface ScrapingResult {
  source: string;
  destination: string;
  buses: BusRoute[];
  scrapedAt: string;
  totalBuses: number;
}

interface ScrapingConfig {
  sourceCity: string;
  destinationCities: string[] | 'ALL';
  delayBetweenRequests: number; // milliseconds
  maxDestinations: number; // limit for testing
  headless: boolean;
  outputDir: string;
}

// ============================================
// CONFIGURATION
// ============================================

const config: ScrapingConfig = {
  sourceCity: 'CHENNAI', // Simple name for autocomplete search
  destinationCities: ['MADURAI'], // Test with just 1 destination first
  delayBetweenRequests: 3000, // 3 seconds between requests to be respectful
  maxDestinations: 1, // Set to -1 for all destinations
  headless: false, // Set to true for background execution
  outputDir: './scraped-data',
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveToJson(data: unknown, filename: string): void {
  const outputPath = path.join(config.outputDir, filename);
  ensureDirectoryExists(config.outputDir);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Saved: ${outputPath}`);
}

// ============================================
// SCRAPING FUNCTIONS
// ============================================

async function getAvailableDestinations(page: Page, source: string): Promise<string[]> {
  console.log(`📍 Fetching destinations from ${source}...`);
  
  try {
    // Navigate to the search page
    await page.goto('https://www.tnstc.in/OTRSOnline/', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Wait for the source dropdown to be available (using actual selector from inspection)
    await page.waitForSelector('#matchStartPlace', {
      timeout: 10000,
    });

    // Fill source location
    const sourceInput = await page.$('#matchStartPlace');
    if (sourceInput) {
      await sourceInput.click();
      await sourceInput.fill(source);
      await delay(1500);
      
      // Wait for jQuery UI autocomplete suggestions
      await page.waitForSelector('.ui-autocomplete:visible li', {
        timeout: 5000,
      }).catch(() => console.log('No autocomplete found'));
      
      // Click the first matching suggestion
      const suggestion = await page.$('.ui-autocomplete:visible li:first-child');
      if (suggestion) {
        await suggestion.click();
        await delay(500);
      }
    }

    // Now trigger destination input to get all options
    const destinationInput = await page.$('#matchEndPlace');
    if (destinationInput) {
      await destinationInput.click();
      await destinationInput.fill(''); // Empty fill to trigger autocomplete
      await delay(1000);
      
      // Type a single letter to get suggestions (common letters)
      for (const letter of ['A', 'B', 'C', 'M', 'T', 'K', 'S']) {
        await destinationInput.fill(letter);
        await delay(1000);
        
        // Get all destination options from autocomplete
        const newDestinations = await page.$$eval(
          '.ui-autocomplete:visible li',
          (elements) => elements.map(el => el.textContent?.trim() || '').filter(Boolean)
        );
        
        if (newDestinations.length > 0) {
          console.log(`   Found ${newDestinations.length} destinations starting with ${letter}`);
        }
        
        await destinationInput.fill('');
        await delay(500);
      }
      
      // For simplicity, return a predefined list of major destinations
      // The website uses autocomplete, so we need to know destinations in advance
      const majorDestinations = [
        'MADURAI', 'COIMBATORE', 'TRICHY', 'SALEM', 'TIRUNELVELI',
        'KANYAKUMARI', 'THANJAVUR', 'VELLORE', 'ERODE', 'KARUR',
        'DINDIGUL', 'THENI', 'VIRUDHUNAGAR', 'THOOTHUKUDI', 'NAGERCOIL',
        'KUMBAKONAM', 'VILLUPURAM', 'CUDDALORE', 'PONDICHERRY', 'TIRUPPUR',
        'HOSUR', 'KRISHNAGIRI', 'DHARMAPURI', 'NAMAKKAL', 'TIRUVANNAMALAI',
        'CHIDAMBARAM', 'NAGAPATTINAM', 'MAYILADUTHURAI', 'RAMESHWARAM', 'OOTY',
        'KODAIKANAL', 'BANGALORE', 'TIRUPATHI', 'VELANKANNI', 'PALANI'
      ];
      
      console.log(`📋 Using ${majorDestinations.length} major destinations`);
      return majorDestinations;
    }

    return [];
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
}

async function searchBuses(page: Page, source: string, destination: string): Promise<BusRoute[]> {
  console.log(`🔍 Searching buses: ${source} → ${destination}`);
  
  const buses: BusRoute[] = [];
  
  try {
    // Navigate to OTRS booking page (search form)
    console.log(`   📍 Loading OTRS page...`);
    await page.goto('https://www.tnstc.in/OTRSOnline/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log(`   ✅ OTRS page loaded`);

    await delay(3000);
    
    // Close any popups that appear on page load
    await closePopups(page);
    await delay(1000);
    
    // Wait for the form to be ready
    await page.waitForSelector('#matchStartPlace', { timeout: 10000 });
    console.log(`   ✅ Search form loaded`);

    // Take screenshot before filling
    await takeScreenshot(page, 'before-fill');

    // Fill source using locator (more reliable)
    console.log(`   📍 Entering source: ${source}`);
    const sourceLocator = page.locator('#matchStartPlace');
    await sourceLocator.click();
    await delay(500);
    
    // Triple-click to select all text, then delete
    await sourceLocator.click({ clickCount: 3 });
    await delay(200);
    await page.keyboard.press('Backspace');
    await delay(300);
    
    // Type the source name character by character
    const sourceText = source; // e.g., "CHENNAI"
    console.log(`   ⌨️ Typing source: "${sourceText}"`);
    await sourceLocator.pressSequentially(sourceText, { delay: 150 });
    
    // Wait 3 seconds for dropdown to populate
    console.log(`   ⏳ Waiting 3 seconds for source dropdown...`);
    await delay(3000);
    
    // Take screenshot to see dropdown
    await takeScreenshot(page, 'source-dropdown');
    
    // Check if autocomplete dropdown is visible (use .first() since there are 2 autocomplete elements)
    const sourceAutocompleteVisible = await page.locator('.ui-autocomplete').first().isVisible().catch(() => false);
    console.log(`   📋 Source autocomplete visible: ${sourceAutocompleteVisible}`);
    
    if (sourceAutocompleteVisible) {
      // Click the first suggestion from the first (source) autocomplete
      await page.locator('.ui-autocomplete').first().locator('li.ui-menu-item').first().click();
      console.log(`   ✅ Selected source from autocomplete dropdown`);
      await delay(2000);
    } else {
      console.log(`   ⚠️ No autocomplete dropdown visible, trying keyboard navigation`);
      await page.keyboard.press('ArrowDown');
      await delay(500);
      await page.keyboard.press('Enter');
      await delay(1000);
    }

    // Fill destination
    console.log(`   📍 Entering destination: ${destination}`);
    const destLocator = page.locator('#matchEndPlace');
    await destLocator.click();
    await delay(500);
    
    // Triple-click to select all, then delete
    await destLocator.click({ clickCount: 3 });
    await delay(200);
    await page.keyboard.press('Backspace');
    await delay(300);
    
    // Type the destination name
    const destText = destination; // e.g., "MADURAI"
    console.log(`   ⌨️ Typing destination: "${destText}"`);
    await destLocator.pressSequentially(destText, { delay: 150 });
    
    // Wait 3 seconds for dropdown to populate
    console.log(`   ⏳ Waiting 3 seconds for destination dropdown...`);
    await delay(3000);
    
    // Take screenshot to see dropdown
    await takeScreenshot(page, 'destination-dropdown');
    
    // Check if autocomplete dropdown is visible (use .first() since there are 2 autocomplete elements)
    const destAutocompleteVisible = await page.locator('.ui-autocomplete').first().isVisible().catch(() => false);
    console.log(`   📋 Destination autocomplete visible: ${destAutocompleteVisible}`);
    
    if (destAutocompleteVisible) {
      // Click the first suggestion from the visible autocomplete
      await page.locator('.ui-autocomplete').first().locator('li.ui-menu-item').first().click();
      console.log(`   ✅ Selected destination from autocomplete dropdown`);
      await delay(2000);
    } else {
      console.log(`   ⚠️ No autocomplete dropdown visible, trying keyboard navigation`);
      await page.keyboard.press('ArrowDown');
      await delay(500);
      await page.keyboard.press('Enter');
      await delay(1000);
    }

    // Set date to tomorrow using jQuery UI datepicker
    const dateInput = await page.$('#txtdeptDateOtrip');
    if (dateInput) {
      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day = String(tomorrow.getDate()).padStart(2, '0');
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const year = tomorrow.getFullYear();
      const dateStr = `${day}/${month}/${year}`; // DD/MM/YYYY format
      
      console.log(`   📅 Setting travel date to: ${dateStr}`);
      
      // Click to open the datepicker
      await dateInput.click();
      await delay(500);
      
      // The datepicker uses jQuery UI - we need to select the date via the picker
      // Wait for datepicker to appear
      await page.waitForSelector('.ui-datepicker', { timeout: 5000 }).catch(() => {});
      
      // Click on tomorrow's date in the datepicker
      // First, find the active month view and click the correct day
      const dayToSelect = tomorrow.getDate();
      const _daySelector = `.ui-datepicker-calendar td[data-handler="selectDay"] a:text("${dayToSelect}")`;
      
      // Try to click the day directly, or use JavaScript to set the value
      try {
        await page.click(`.ui-datepicker-calendar a.ui-state-default:text-is("${dayToSelect}")`, { timeout: 3000 });
        console.log(`   ✅ Selected date from datepicker`);
      } catch {
        // If clicking doesn't work, use JavaScript to set the value
        await page.evaluate((dateValue) => {
          const input = document.getElementById('txtdeptDateOtrip') as HTMLInputElement;
          if (input) {
            input.removeAttribute('readonly');
            input.value = dateValue;
            input.setAttribute('readonly', 'readonly');
            // Trigger change event
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, dateStr);
        console.log(`   ✅ Set date via JavaScript`);
      }
      
      await delay(500);
      // Close datepicker by pressing Escape or clicking elsewhere
      await page.keyboard.press('Escape');
      await delay(300);
    }

    // Click search button using correct selector from inspection
    const searchButton = await page.$('#searchButton');
    if (searchButton) {
      await searchButton.click();
    }

    // Wait for results page to load
    await delay(5000);
    
    // Take screenshot of results for debugging
    await takeScreenshot(page, `search_results_${source}_${destination}`);

    // Wait for results container - need to inspect actual results page structure
    await page.waitForSelector('table, .bus-list, .service-list, .result-container', {
      timeout: 30000,
    }).catch(() => console.log('Results container not found'));

    // Extract bus data from results
    // Try multiple selector patterns
    const busElements = await page.$$('table tbody tr, .bus-item, .service-row, .route-item');
    
    console.log(`   Found ${busElements.length} bus entries`);

    for (let i = 0; i < busElements.length; i++) {
      const busEl = busElements[i];
      
      try {
        // Try to extract data with various selectors
        const cells = await busEl.$$('td');
        
        if (cells.length >= 4) {
          const busData: BusRoute = {
            busNumber: await cells[0]?.textContent() || '',
            busType: cells.length > 1 ? await cells[1]?.textContent() || '' : '',
            source: source,
            destination: destination,
            departureTime: cells.length > 2 ? await cells[2]?.textContent() || '' : '',
            arrivalTime: cells.length > 3 ? await cells[3]?.textContent() || '' : '',
            duration: cells.length > 4 ? await cells[4]?.textContent() || '' : '',
            fare: cells.length > 5 ? await cells[5]?.textContent() || '' : '',
            viaStops: [],
            stopDetails: [],
            scrapedAt: new Date().toISOString(),
          };

          // Clean up the extracted text
          busData.busNumber = busData.busNumber.trim();
          busData.busType = busData.busType.trim();
          busData.departureTime = busData.departureTime.trim();
          busData.arrivalTime = busData.arrivalTime.trim();
          busData.duration = busData.duration.trim();
          busData.fare = busData.fare.trim();

          if (busData.busNumber || busData.departureTime) {
            buses.push(busData);
          }
        }
      } catch (busError) {
        console.log(`   ⚠️ Error extracting bus ${i + 1}:`, busError);
      }
    }

    // If no structured elements found, try to get page content for analysis
    if (buses.length === 0) {
      console.log('   No buses found with standard selectors, analyzing page...');
      const pageContent = await page.content();
      
      // Save page content for manual analysis
      const contentPath = path.join(config.outputDir, `page_content_${sanitizeFilename(destination)}.html`);
      fs.writeFileSync(contentPath, pageContent);
      console.log(`   Page content saved to ${contentPath} for analysis`);
    }

  } catch (error) {
    console.error(`   ❌ Error searching ${source} → ${destination}:`, error);
  }

  console.log(`   ✅ Extracted ${buses.length} buses`);
  return buses;
}

async function takeScreenshot(page: Page, name: string): Promise<void> {
  const screenshotsDir = path.join(config.outputDir, 'screenshots');
  ensureDirectoryExists(screenshotsDir);
  await page.screenshot({ 
    path: path.join(screenshotsDir, `${sanitizeFilename(name)}.png`),
    fullPage: true,
  });
}

/**
 * Close any popups that appear on the TNSTC website
 */
async function closePopups(page: Page): Promise<void> {
  try {
    // Close WhatsApp booking popup
    const popupClose = await page.$('#popup-close');
    if (popupClose) {
      await popupClose.click();
      console.log('   ✅ Closed WhatsApp popup');
      await delay(500);
    }
    
    // Close any other modal popups
    const modalClose = await page.$('.close-btn, .modal .close, [data-dismiss="modal"]');
    if (modalClose) {
      await modalClose.click();
      console.log('   ✅ Closed modal popup');
      await delay(500);
    }
    
    // Click outside popup overlay to close
    const overlay = await page.$('#popup-overlay[style*="block"]');
    if (overlay) {
      await page.click('body', { position: { x: 10, y: 10 } });
      await delay(500);
    }
  } catch (_e) {
    // Ignore popup close errors
  }
}

// ============================================
// MAIN SCRAPING FUNCTION
// ============================================

async function main(): Promise<void> {
  console.log('🚌 TNSTC Bus Route Scraper');
  console.log('==========================\n');

  const browser: Browser = await chromium.launch({
    headless: config.headless,
    slowMo: 100, // Slow down actions for visibility
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Page Error:', msg.text());
    }
  });

  const allResults: ScrapingResult[] = [];

  try {
    // First, take a screenshot of the landing page
    await page.goto('https://www.tnstc.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await delay(2000);
    await takeScreenshot(page, 'tnstc-homepage');
    
    // Close any popups on homepage
    await closePopups(page);

    // Navigate to OTRS booking page (search form)
    console.log('📍 Navigating to OTRS booking page...');
    await page.goto('https://www.tnstc.in/OTRSOnline/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('   ✅ OTRS page loaded');
    await delay(3000);
    
    // Close popups on OTRS page
    await closePopups(page);
    await takeScreenshot(page, 'search-page');

    // Get available destinations
    let destinations: string[];
    if (config.destinationCities === 'ALL') {
      destinations = await getAvailableDestinations(page, config.sourceCity);
    } else {
      destinations = config.destinationCities;
    }

    // Limit destinations if configured
    if (config.maxDestinations > 0 && destinations.length > config.maxDestinations) {
      destinations = destinations.slice(0, config.maxDestinations);
      console.log(`⚠️ Limited to ${config.maxDestinations} destinations for testing`);
    }

    console.log(`\n📋 Will scrape routes to ${destinations.length} destinations\n`);

    // Scrape each destination
    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i];
      console.log(`\n[${i + 1}/${destinations.length}] Processing: ${config.sourceCity} → ${destination}`);

      const buses = await searchBuses(page, config.sourceCity, destination);

      if (buses.length > 0) {
        const result: ScrapingResult = {
          source: config.sourceCity,
          destination,
          buses,
          scrapedAt: new Date().toISOString(),
          totalBuses: buses.length,
        };

        allResults.push(result);

        // Save individual route file
        const filename = `route_${sanitizeFilename(config.sourceCity)}_to_${sanitizeFilename(destination)}.json`;
        saveToJson(result, filename);
      }

      // Take screenshot of results
      await takeScreenshot(page, `results_${config.sourceCity}_to_${destination}`);

      // Respectful delay between requests
      if (i < destinations.length - 1) {
        console.log(`   ⏳ Waiting ${config.delayBetweenRequests / 1000}s before next request...`);
        await delay(config.delayBetweenRequests);
      }
    }

    // Save combined results
    const combinedFilename = `all_routes_from_${sanitizeFilename(config.sourceCity)}.json`;
    saveToJson({
      source: config.sourceCity,
      totalRoutes: allResults.length,
      totalBuses: allResults.reduce((sum, r) => sum + r.totalBuses, 0),
      scrapedAt: new Date().toISOString(),
      routes: allResults,
    }, combinedFilename);

    // Generate summary
    console.log('\n==========================');
    console.log('📊 SCRAPING SUMMARY');
    console.log('==========================');
    console.log(`Source: ${config.sourceCity}`);
    console.log(`Destinations scraped: ${allResults.length}`);
    console.log(`Total buses found: ${allResults.reduce((sum, r) => sum + r.totalBuses, 0)}`);
    console.log(`Output directory: ${config.outputDir}`);

  } catch (error) {
    console.error('Fatal error:', error);
    await takeScreenshot(page, 'error-state');
  } finally {
    await browser.close();
    console.log('\n✅ Scraping complete!');
  }
}

// ============================================
// EXPORT FOR PERUNDHU IMPORT
// ============================================

export function convertToPerundhuFormat(results: ScrapingResult[]): unknown {
  const buses: unknown[] = [];
  
  for (const result of results) {
    for (const bus of result.buses) {
      buses.push({
        busNumber: bus.busNumber,
        name: `${bus.busType} - ${bus.busNumber}`,
        operator: 'TNSTC',
        type: bus.busType,
        fromLocation: bus.source,
        toLocation: bus.destination,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        capacity: 50, // Default
        active: true,
        stops: bus.stopDetails.map(stop => ({
          name: stop.stopName,
          arrivalTime: stop.arrivalTime,
          departureTime: stop.departureTime,
          stopOrder: stop.stopOrder,
        })),
      });
    }
  }

  return {
    importedAt: new Date().toISOString(),
    source: 'TNSTC Website Scraper',
    totalBuses: buses.length,
    buses,
  };
}

// Run the scraper
main().catch(console.error);

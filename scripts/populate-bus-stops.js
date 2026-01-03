/**
 * Fetch bus stops from Nominatim/OSM for Tamil Nadu cities
 * and insert them into the database
 */

const CITIES = [
  'Madurai', 'Chennai', 'Coimbatore', 'Salem', 'Tiruppur', 'Trichy', 'Erode',
  'Vellore', 'Ranipet', 'Kanchipuram', 'Chengalpattu', 'Villupuram', 
  'Tiruvannamalai', 'Cuddalore', 'Chidambaram', 'Thanjavur', 'Kumbakonam',
  'Perambalur', 'Pudukkottai', 'Ariyalur', 'Namakkal', 'Dindigul', 'Theni',
  'Tirunelveli', 'Thoothukudi', 'Nagercoil', 'Kanyakumari', 'Virudunagar',
  'Sivakasi', 'Aruppukottai', 'Pollachi', 'Udumalaipet', 'Hosur'
];

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function fetchBusStops(city) {
  try {
    // First try bus stations
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=bus+station+${city},+Tamil+Nadu,+India&format=json&limit=5&namedetails=1`,
      {
        headers: {
          'User-Agent': 'Perundhu Bus App',
          'Accept-Language': 'en,ta'
        }
      }
    );
    
    let data = await response.json();
    
    // If no stations, try bus stops
    if (data.length === 0) {
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=bus+stop+${city},+Tamil+Nadu,+India&format=json&limit=5&namedetails=1`,
        {
          headers: {
            'User-Agent': 'Perundhu Bus App',
            'Accept-Language': 'en,ta'
          }
        }
      );
      data = await response.json();
    }
    
    // Extract unique bus stops (limit to 3 per city)
    const stops = data.slice(0, 3).map(item => {
      const name = item.namedetails?.['name:en'] || 
                   item.namedetails?.name || 
                   item.name || '';
      
      if (name && name.length > 3) {
        return {
          name: name.trim(),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          city: city
        };
      }
      return null;
    }).filter(Boolean);
    
    if (stops.length > 0) {
      console.log(`✓ ${city}: ${stops.length} stops`);
      stops.forEach(stop => {
        console.log(`  • ${stop.name}`);
      });
    }
    
    return stops;
    
  } catch (error) {
    console.log(`⚠ ${city}: ${error.message}`);
    return [];
  }
}

async function insertBusStops(stops) {
  if (stops.length === 0) return;
  
  // Build SQL insert statement
  const values = stops.map(stop => {
    const name = stop.name.replace(/'/g, "''");
    return `('${name}', ${stop.lat}, ${stop.lon}, '${stop.city}', '${stop.city}')`;
  }).join(',\n');
  
  const sql = `INSERT IGNORE INTO locations (name, latitude, longitude, district, nearby_city) VALUES\n${values};`;
  
  try {
    const { stdout, stderr } = await execAsync(
      `echo "${sql}" | mysql -h 127.0.0.1 -u root -proot perundhu`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    
    if (stderr && !stderr.includes('Warning')) {
      console.log(`  Error: ${stderr}`);
    }
  } catch (error) {
    console.log(`  DB Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Fetching bus stops from Nominatim/OSM...\n');
  
  let allStops = [];
  let count = 0;
  
  for (const city of CITIES) {
    console.log(`🔍 ${city}...`, );
    const stops = await fetchBusStops(city);
    allStops = allStops.concat(stops);
    
    // Insert in batches to avoid command line length limits
    if (allStops.length >= 50 || city === CITIES[CITIES.length - 1]) {
      if (allStops.length > 0) {
        process.stdout.write(' ');
        await insertBusStops(allStops);
        count += allStops.length;
        console.log(`  ✅ Inserted ${allStops.length} stops`);
        allStops = [];
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  
  console.log(`\n✅ Completed! Inserted ${count} total bus stops`);
  
  // Show summary
  console.log('\n📊 Verifying inserted data...');
  try {
    const { stdout } = await execAsync(
      `mysql -h 127.0.0.1 -u root -proot perundhu -e "SELECT nearby_city, COUNT(*) as count FROM locations WHERE name LIKE '%Bus%' GROUP BY nearby_city ORDER BY count DESC LIMIT 15;"`
    );
    console.log(stdout);
  } catch (error) {
    console.log(`  Verification error: ${error.message}`);
  }
}

main().catch(console.error);

/**
 * Scrape bus stands from Nominatim/OSM for Tamil Nadu cities
 * and insert them into the database
 */
import * as mysql from 'mysql2/promise';

interface BusStand {
  name: string;
  latitude: number;
  longitude: number;
  city: string;
}

const TAMIL_NADU_CITIES = [
  'Chennai',
  'Madurai',
  'Trichy',
  'Coimbatore',
  'Salem',
  'Tiruppur',
  'Erode',
  'Aruppukottai',
  'Sivakasi',
  'Virudunagar',
  'Nagercoil',
  'Kanyakumari',
  'Tirunelveli',
  'Thoothukudi',
  'Theni',
  'Dindigul',
  'Karur',
  'Villupuram',
  'Vellore',
  'Chengalpattu',
  'Kanchipuram',
  'Ranipet',
  'Tiruppattur',
  'Krishnagiri',
  'Hosur',
  'Dharmapuri',
  'Tiruvannamalai',
  'Pudukkottai',
  'Perambalur',
  'Ariyalur',
  'Namakkal',
  'Salem',
  'Yercaud',
  'Tirupati',
  'Tirupur',
  'Erode',
  'Kumbakonam',
  'Thanjavur',
  'Mayiladuthurai',
  'Kallakurichi',
  'Villupuram',
  'Pondicherry',
  'Cudalore',
  'Chidambaram'
];

async function searchBusStandsNominatim(city: string): Promise<BusStand[]> {
  const busStands: BusStand[] = [];

  try {
    console.log(`🔍 Searching for bus stands in ${city}...`);
    
    // Search for "bus station" and "bus stop" in the city
    const searchQueries = [
      `bus station ${city}, Tamil Nadu, India`,
      `bus stop ${city}, Tamil Nadu, India`,
      `bus stand ${city}, Tamil Nadu, India`,
      `TNSTC ${city}, Tamil Nadu, India`,
    ];

    for (const query of searchQueries) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
            q: query,
            format: 'json',
            countrycodes: 'in',
            limit: '10',
            addressdetails: '1',
            namedetails: '1'
          }),
          {
            headers: {
              'User-Agent': 'Perundhu Bus App (https://perundhu.com)',
              'Accept-Language': 'en,ta'
            }
          }
        );

        if (!response.ok) continue;

        const results: any[] = await response.json();
        
        for (const result of results) {
          // Only include actual bus stations/stops/stands
          const isBusRelated = 
            result.type === 'bus_station' || 
            result.type === 'bus_stop' ||
            (result.class === 'amenity' && 
             (result.type === 'bus_station' || result.type === 'bus_stop')) ||
            result.display_name?.toLowerCase().includes('bus station') ||
            result.display_name?.toLowerCase().includes('bus stop') ||
            result.display_name?.toLowerCase().includes('bus stand');

          if (isBusRelated) {
            const name = result.namedetails?.['name:en'] || 
                        result.namedetails?.['name'] ||
                        result.name || 
                        result.display_name?.split(',')[0];

            // Skip if it doesn't have city in the name or is too generic
            if (name && name.length > 5) {
              busStands.push({
                name: name.trim(),
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                city: city
              });
            }
          }
        }

        // Add small delay to respect Nominatim's rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`  ⚠️  Error searching query "${query}": ${error}`);
      }
    }

    // Remove duplicates
    const uniqueStands = Array.from(new Map(
      busStands.map(stand => [stand.name.toLowerCase(), stand])
    ).values());

    if (uniqueStands.length > 0) {
      console.log(`  ✅ Found ${uniqueStands.length} unique bus stands in ${city}`);
      uniqueStands.forEach(stand => {
        console.log(`     • ${stand.name}`);
      });
    } else {
      console.log(`  ℹ️  No bus stands found for ${city}`);
    }

    return uniqueStands;

  } catch (error) {
    console.log(`❌ Error searching for bus stands in ${city}:`, error);
    return [];
  }
}

async function insertBusStandsToDatabase(busStands: BusStand[]) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'perundhu'
  });

  try {
    console.log(`\n💾 Inserting ${busStands.length} bus stands into database...`);
    
    let inserted = 0;
    let duplicates = 0;

    for (const stand of busStands) {
      try {
        // Check if location already exists
        const [existing]: any = await connection.execute(
          'SELECT id FROM locations WHERE LOWER(name) = LOWER(?)',
          [stand.name]
        );

        if (existing.length > 0) {
          console.log(`  ⏭️  Skipping duplicate: ${stand.name}`);
          duplicates++;
          continue;
        }

        // Insert the bus stand
        const [result]: any = await connection.execute(
          `INSERT INTO locations (name, latitude, longitude, district, nearby_city, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            stand.name,
            stand.latitude,
            stand.longitude,
            stand.city,
            stand.city
          ]
        );

        inserted++;
        console.log(`  ✅ ${stand.name} (${stand.city})`);

      } catch (error) {
        console.log(`  ❌ Error inserting ${stand.name}: ${error}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Duplicates: ${duplicates}`);

  } finally {
    await connection.end();
  }
}

async function main() {
  console.log('🚀 Starting bus stand scraper for Tamil Nadu...\n');
  
  let allBusStands: BusStand[] = [];

  // Search for bus stands in each city
  for (const city of TAMIL_NADU_CITIES) {
    const stands = await searchBusStandsNominatim(city);
    allBusStands = allBusStands.concat(stands);
  }

  console.log(`\n📍 Total bus stands found: ${allBusStands.length}`);

  // Insert into database
  if (allBusStands.length > 0) {
    await insertBusStandsToDatabase(allBusStands);
  } else {
    console.log('⚠️  No bus stands found to insert');
  }

  console.log('\n✅ Bus stand scraping completed!');
}

main().catch(console.error);

// Quick test for Aruppukottai autocomplete
// Run this in the browser console on the contribute page

console.log('🧪 Testing Aruppukottai autocomplete...');

// Test the COMMON_CITIES array directly
const COMMON_CITIES = [
    'Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur',
    'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur',
    'Nagercoil', 'Kanchipuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam',
    'Arcot', 'Dharmapuri', 'Chidambaram', 'Ambur', 'Nagapattinam', 'Arakkonam', 'Kumbakonam', 'Neyveli', 
    'Cuddalore', 'Mayiladuthurai', 'Pallavaram', 'Pudukkottai', 'Aruppukottai',
    'Virudhunagar', 'Kodaikanal', 'Yercaud', 'Kanyakumari', 'Srivilliputhur', 'Ramanathapuram',
    'Tenkasi', 'Theni', 'Palani', 'Krishnagiri', 'Namakkal', 'Villupuram', 'Vellore',
    'Tiruvallur', 'Tirupattur', 'Kallakurichi', 'Chengalpattu', 'Thoothukudi', 'Tiruvarur',
    'Perambalur', 'Ariyalur', 'Nilgiris', 'Thenkasi'
];

function testSearch(query) {
    const lowerQuery = query.toLowerCase().trim();
    const matches = [];
    
    console.log(`🔍 Testing search for: "${query}" (normalized: "${lowerQuery}")`);
    
    COMMON_CITIES.forEach((city, index) => {
        const lowerCity = city.toLowerCase();
        
        if (lowerCity.includes(lowerQuery)) {
            matches.push(city);
            console.log(`✅ Match found: "${city}" contains "${lowerQuery}"`);
        }
    });
    
    return matches;
}

// Test cases
console.log('\n📋 Test Results:');
console.log('1. "Arup" →', testSearch('Arup'));
console.log('2. "arup" →', testSearch('arup'));
console.log('3. "Arupp" →', testSearch('Arupp'));
console.log('4. "Aruppukottai" →', testSearch('Aruppukottai'));

// Check if Aruppukottai is in the array
const hasAruppukottai = COMMON_CITIES.includes('Aruppukottai');
console.log(`\n🎯 Is "Aruppukottai" in COMMON_CITIES array? ${hasAruppukottai}`);

if (hasAruppukottai) {
    const index = COMMON_CITIES.indexOf('Aruppukottai');
    console.log(`📍 Position in array: ${index}`);
    console.log(`✅ Array entry: "${COMMON_CITIES[index]}"`);
}

// Test the actual autocomplete service if available
if (window.locationAutocompleteService) {
    console.log('\n🔧 Testing actual autocomplete service...');
    window.locationAutocompleteService.getLocationSuggestions('Arup')
        .then(results => {
            console.log('🏙️ Autocomplete results for "Arup":', results);
            const hasAruppu = results.some(r => r.name === 'Aruppukottai');
            console.log(`🎯 Aruppukottai in results? ${hasAruppu}`);
        })
        .catch(err => console.error('❌ Autocomplete error:', err));
} else {
    console.log('⚠️ locationAutocompleteService not available in window scope');
}

console.log('\n💡 If Aruppukottai is not showing for "Arup":');
console.log('1. Check that the search is case-insensitive');
console.log('2. Verify the COMMON_CITIES array includes "Aruppukottai"');
console.log('3. Test the includes() method manually');
console.log('4. Check for any filtering in the UI component');

// Manual verification
console.log('\n🧪 Manual verification:');
console.log('"Aruppukottai".toLowerCase().includes("arup"):', "Aruppukottai".toLowerCase().includes("arup"));
console.log('"aruppukottai".includes("arup"):', "aruppukottai".includes("arup"));
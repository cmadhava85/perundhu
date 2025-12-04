// Debug script to test API calls from frontend
console.log('Testing API connection...');

const testApiCall = async () => {
  try {
    const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';
    const response = await fetch(`${API_URL}/api/v1/bus-schedules/locations?lang=en`);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Number of locations:', data.length);
    } else {
      console.error('API Error:', response.statusText);
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
};

testApiCall();
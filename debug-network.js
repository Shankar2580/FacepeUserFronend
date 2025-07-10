// Network debugging script for face registration API
// Run this script to test connectivity to your face registration server

const testConnectivity = async () => {
  const FACE_API_URL = 'https://18.188.145.222:8443';
  
  console.log('🔍 Testing Face Registration API Connectivity...');
  console.log('📡 Target URL:', FACE_API_URL);
  
  try {
    // Test basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const response = await fetch(FACE_API_URL, {
      method: 'GET',
      timeout: 5000
    });
    
    console.log('✅ Server is reachable!');
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    // Test the specific endpoint
    console.log('\n2. Testing /register endpoint...');
    const registerResponse = await fetch(`${FACE_API_URL}/register`, {
      method: 'OPTIONS', // CORS preflight
      timeout: 5000
    });
    
    console.log('✅ /register endpoint is accessible!');
    console.log('📊 Status:', registerResponse.status);
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Check if your face registration API is running on port 8443');
      console.log('2. Verify the IP address (18.188.145.222) is correct');
      console.log('3. Make sure your device has internet connectivity');
      console.log('4. Check firewall settings');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔧 Timeout Error - Check:');
      console.log('1. Network connectivity');
      console.log('2. Server response time');
      console.log('3. Firewall blocking the connection');
    }
  }
};

// Run the test
testConnectivity(); 
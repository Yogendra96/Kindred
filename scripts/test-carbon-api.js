#!/usr/bin/env node
/**
 * @fileoverview Carbon API Testing Script
 * 
 * Tests connectivity and functionality of Carbon API providers
 * Helps validate API keys and configuration
 * 
 * Usage: bun run test:carbon-api
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// API Provider configurations
const providers = [
  {
    name: 'Carbon Interface',
    baseURL: 'https://www.carboninterface.com/api/v1',
    apiKey: process.env.CARBON_API_KEY,
    testEndpoint: '/estimates',
    headers: {
      'Authorization': `Bearer ${process.env.CARBON_API_KEY}`,
      'Content-Type': 'application/json'
    },
    testPayload: {
      type: 'vehicle',
      distance_unit: 'mi',
      distance_value: 10,
      vehicle_model_id: '7268a9b7-17e8-4c8d-acca-57059252afe9' // 2019 Toyota Camry
    }
  },
  {
    name: 'Climatiq',
    baseURL: 'https://beta3.api.climatiq.io',
    apiKey: process.env.CLIMATIQ_API_KEY,
    testEndpoint: '/estimate',
    headers: {
      'Authorization': `Bearer ${process.env.CLIMATIQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    testPayload: {
      emission_factor: {
        activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
        source: 'EPA',
        region: 'US',
        year: 2021
      },
      parameters: {
        distance: 10,
        distance_unit: 'mi'
      }
    }
  }
];

async function testProvider(provider) {
  log(`\n🔍 Testing ${provider.name}...`, 'cyan');
  
  if (!provider.apiKey || provider.apiKey.includes('your_') || provider.apiKey === 'mock_key_for_development') {
    log(`   ⚠️  API Key not configured (using mock/placeholder key)`, 'yellow');
    log(`   📝 Update ${provider.name.toLowerCase().replace(' ', '_').toUpperCase()}_API_KEY in .env file`, 'yellow');
    return { success: false, reason: 'No API key' };
  }

  const startTime = Date.now();
  
  try {
    log(`   🌐 Making request to: ${provider.baseURL}${provider.testEndpoint}`, 'blue');
    log(`   📦 Payload: ${JSON.stringify(provider.testPayload, null, 2)}`, 'blue');
    
    const response = await axios.post(
      `${provider.baseURL}${provider.testEndpoint}`,
      provider.testPayload,
      {
        headers: provider.headers,
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const responseSize = JSON.stringify(response.data).length;

    if (response.status === 200 || response.status === 201) {
      log(`   ✅ Success! (${response.status}) in ${responseTime}ms`, 'green');
      log(`   📊 Response size: ${formatBytes(responseSize)}`, 'green');
      
      // Log key response data
      if (response.data) {
        const co2Data = extractCO2Data(response.data, provider.name);
        if (co2Data) {
          log(`   🌍 CO2 Emissions: ${co2Data}`, 'green');
        }
        log(`   📋 Sample response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`, 'blue');
      }
      
      return { 
        success: true, 
        responseTime, 
        status: response.status,
        data: response.data 
      };
    } else {
      log(`   ❌ API Error: ${response.status} - ${response.statusText}`, 'red');
      log(`   📋 Error details: ${JSON.stringify(response.data, null, 2)}`, 'red');
      return { 
        success: false, 
        reason: `HTTP ${response.status}`,
        error: response.data
      };
    }

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (error.response) {
      log(`   ❌ API Error: ${error.response.status} - ${error.response.statusText}`, 'red');
      log(`   📋 Error details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      return { 
        success: false, 
        reason: `HTTP ${error.response.status}`,
        responseTime,
        error: error.response.data
      };
    } else if (error.request) {
      log(`   ❌ Network Error: No response received (${responseTime}ms timeout)`, 'red');
      log(`   🔧 Check internet connection and API endpoint`, 'yellow');
      return { 
        success: false, 
        reason: 'Network timeout',
        responseTime
      };
    } else {
      log(`   ❌ Request Error: ${error.message}`, 'red');
      return { 
        success: false, 
        reason: error.message
      };
    }
  }
}

function extractCO2Data(data, providerName) {
  try {
    // Carbon Interface format
    if (data.data && data.data.attributes && data.data.attributes.carbon_kg) {
      return `${data.data.attributes.carbon_kg} kg CO2`;
    }
    
    // Climatiq format
    if (data.co2e) {
      return `${data.co2e} kg CO2e`;
    }
    
    // Generic search for CO2 values
    const jsonStr = JSON.stringify(data);
    const co2Match = jsonStr.match(/"(?:carbon|co2|emission)[^"]*":\s*([0-9.]+)/i);
    if (co2Match) {
      return `${co2Match[1]} kg CO2 (estimated)`;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function runTests() {
  log('🚀 Carbon API Connectivity Test', 'bright');
  log('=====================================', 'bright');
  
  log('\n📋 Environment Configuration:', 'cyan');
  log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  log(`   ENABLE_API_MOCKING: ${process.env.ENABLE_API_MOCKING || 'not set'}`);
  log(`   CARBON_API_BASE_URL: ${process.env.CARBON_API_BASE_URL || 'not set'}`);
  log(`   CARBON_CONFIDENCE_THRESHOLD: ${process.env.CARBON_CONFIDENCE_THRESHOLD || 'not set'}`);

  const results = [];
  
  // Test each provider
  for (const provider of providers) {
    const result = await testProvider(provider);
    results.push({ ...result, name: provider.name });
  }
  
  // Summary
  log('\n📊 Test Summary:', 'bright');
  log('================', 'bright');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`\n✅ Successful: ${successful.length}/${results.length}`, successful.length > 0 ? 'green' : 'red');
  successful.forEach(result => {
    log(`   • ${result.name}: ${result.responseTime}ms (HTTP ${result.status})`, 'green');
  });
  
  if (failed.length > 0) {
    log(`\n❌ Failed: ${failed.length}/${results.length}`, 'red');
    failed.forEach(result => {
      log(`   • ${result.name}: ${result.reason}`, 'red');
    });
  }

  // Recommendations
  log('\n💡 Recommendations:', 'yellow');
  if (successful.length === 0) {
    log('   ⚠️  No APIs are working - app will use offline calculations', 'yellow');
    log('   🔧 Set up at least one API key for better accuracy', 'yellow');
    log('   📖 See docs/CARBON_API_SETUP.md for setup instructions', 'yellow');
  } else if (successful.length === 1) {
    log('   ⚠️  Only one API working - consider adding backup providers', 'yellow');
    log('   🔧 Add additional API keys for better reliability', 'yellow');
  } else {
    log('   ✅ Multiple APIs working - excellent redundancy!', 'green');
    log('   🚀 Your app has reliable carbon calculation capabilities', 'green');
  }

  // Next steps
  log('\n🎯 Next Steps:', 'cyan');
  if (failed.some(r => r.reason === 'No API key')) {
    log('   1. Get API keys from providers (see docs/CARBON_API_SETUP.md)', 'cyan');
    log('   2. Update .env file with real API keys', 'cyan');
    log('   3. Re-run this test: bun run test:carbon-api', 'cyan');
  } else {
    log('   1. Test the app: bun start', 'cyan');
    log('   2. Add carbon activity and check for real data', 'cyan');
    log('   3. Monitor logs for API usage patterns', 'cyan');
  }

  process.exit(successful.length > 0 ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Test runner error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
#!/usr/bin/env node
/**
 * @fileoverview Carbon API Setup Assistant
 * 
 * Interactive guide to help users set up their Carbon API keys
 * Provides step-by-step instructions and validates configuration
 * 
 * Usage: bun run setup:carbon-api
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function isValidApiKey(key) {
  // Basic validation - not empty and not placeholder
  return key && 
         key.length > 10 && 
         !key.includes('your_') && 
         !key.includes('mock_') &&
         !key.includes('placeholder');
}

function updateEnvFile(envPath, key, value) {
  try {
    let content = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(envPath, content);
    return true;
  } catch (error) {
    log(`❌ Error updating .env file: ${error.message}`, 'red');
    return false;
  }
}

async function setupCarbonInterface(rl) {
  log('\n🌍 Setting up Carbon Interface API', 'bright');
  log('=====================================', 'bright');
  
  log('\n📋 Carbon Interface provides accurate carbon footprint calculations', 'cyan');
  log('   • Free tier: 200 requests/month', 'cyan');
  log('   • Paid plans: Starting at $20/month for 1,000 requests', 'cyan');
  log('   • Most reliable provider with excellent documentation', 'cyan');
  
  log('\n🔗 Steps to get your API key:', 'yellow');
  log('   1. Open: https://www.carboninterface.com/', 'yellow');
  log('   2. Click "Get API Access" or "Sign Up"', 'yellow');
  log('   3. Create account and verify your email', 'yellow');
  log('   4. Navigate to your Dashboard > API Keys', 'yellow');
  log('   5. Copy your API key', 'yellow');
  
  const proceed = await question(rl, '\n❓ Have you completed these steps and have your API key? (y/n): ');
  
  if (proceed.toLowerCase() !== 'y') {
    log('\n⏸️  No problem! Come back when you have your API key.', 'yellow');
    log('   Run this script again with: bun run setup:carbon-api', 'yellow');
    return null;
  }
  
  const apiKey = await question(rl, '\n🔑 Paste your Carbon Interface API key: ');
  
  if (!isValidApiKey(apiKey)) {
    log('\n❌ This doesn\'t look like a valid API key.', 'red');
    log('   • API keys are usually 32+ characters long', 'red');
    log('   • Make sure you copied the entire key', 'red');
    log('   • Don\'t include extra spaces or quotes', 'red');
    return null;
  }
  
  log('\n✅ API key looks valid!', 'green');
  return apiKey.trim();
}

async function setupClimatiq(rl) {
  log('\n🌡️  Setting up Climatiq API (Optional)', 'bright');
  log('=======================================', 'bright');
  
  log('\n📋 Climatiq provides scientific-grade emission factors', 'cyan');
  log('   • Free tier: 1,000 requests/month', 'cyan');
  log('   • Very accurate data from scientific institutions', 'cyan');
  log('   • Great backup for Carbon Interface', 'cyan');
  
  const wantClimatiq = await question(rl, '\n❓ Do you want to set up Climatiq as a backup? (y/n): ');
  
  if (wantClimatiq.toLowerCase() !== 'y') {
    log('   ⏭️  Skipping Climatiq setup. You can add it later.', 'yellow');
    return null;
  }
  
  log('\n🔗 Steps to get your Climatiq API key:', 'yellow');
  log('   1. Open: https://climatiq.io/', 'yellow');
  log('   2. Click "Get Started" and sign up', 'yellow');
  log('   3. Complete email verification', 'yellow');
  log('   4. Go to Dashboard > API Keys', 'yellow');
  log('   5. Create and copy your API key', 'yellow');
  
  const hasKey = await question(rl, '\n❓ Have you obtained your Climatiq API key? (y/n): ');
  
  if (hasKey.toLowerCase() !== 'y') {
    log('   ⏭️  Skipping for now. You can add Climatiq later.', 'yellow');
    return null;
  }
  
  const apiKey = await question(rl, '\n🔑 Paste your Climatiq API key: ');
  
  if (!isValidApiKey(apiKey)) {
    log('\n❌ This doesn\'t look like a valid API key.', 'red');
    return null;
  }
  
  log('\n✅ Climatiq API key looks valid!', 'green');
  return apiKey.trim();
}

async function testConfiguration() {
  log('\n🧪 Testing API Configuration...', 'cyan');
  
  try {
    const { spawn } = require('child_process');
    const test = spawn('node', ['scripts/test-carbon-api.js'], { stdio: 'inherit' });
    
    return new Promise((resolve) => {
      test.on('close', (code) => {
        resolve(code === 0);
      });
    });
  } catch (error) {
    log(`❌ Error running API test: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const rl = createInterface();
  const envPath = path.resolve(__dirname, '../.env');
  
  try {
    log('🚀 Carbon API Setup Assistant', 'bright');
    log('==============================', 'bright');
    
    log('\n🎯 This tool will help you set up live carbon calculation APIs', 'cyan');
    log('   Currently, your app uses offline calculations (less accurate)', 'cyan');
    log('   Adding real API keys will provide precise, real-time data!', 'cyan');
    
    if (!fs.existsSync(envPath)) {
      log(`\n❌ Error: .env file not found at ${envPath}`, 'red');
      log('   Make sure you\'re running this from the project root directory', 'red');
      process.exit(1);
    }
    
    // Setup Carbon Interface (primary)
    const carbonKey = await setupCarbonInterface(rl);
    if (!carbonKey) {
      log('\n⚠️  Setup incomplete. You can run this again later.', 'yellow');
      process.exit(0);
    }
    
    // Setup Climatiq (secondary, optional)
    const climatiqKey = await setupClimatiq(rl);
    
    // Update .env file
    log('\n💾 Updating configuration...', 'cyan');
    
    if (!updateEnvFile(envPath, 'CARBON_API_KEY', carbonKey)) {
      process.exit(1);
    }
    log('   ✅ Updated CARBON_API_KEY', 'green');
    
    if (climatiqKey) {
      if (!updateEnvFile(envPath, 'CLIMATIQ_API_KEY', climatiqKey)) {
        process.exit(1);
      }
      log('   ✅ Updated CLIMATIQ_API_KEY', 'green');
    }
    
    // Test the configuration
    log('\n🧪 Testing your new configuration...', 'cyan');
    const testPassed = await testConfiguration();
    
    if (testPassed) {
      log('\n🎉 Success! Your carbon APIs are working!', 'green');
      log('\n🚀 Next steps:', 'bright');
      log('   1. Start your app: bun start', 'cyan');
      log('   2. Open the Carbon Tracker screen', 'cyan');
      log('   3. Add some activities and see real data!', 'cyan');
      log('   4. Watch the logs for API calls and responses', 'cyan');
      
      log('\n📊 Your setup:', 'yellow');
      log(`   • Primary API: Carbon Interface (${carbonKey.substring(0, 8)}...)`, 'yellow');
      if (climatiqKey) {
        log(`   • Backup API: Climatiq (${climatiqKey.substring(0, 8)}...)`, 'yellow');
      }
      log('   • Offline fallback: Always available', 'yellow');
      
    } else {
      log('\n❌ API test failed. Please check your keys and try again.', 'red');
      log('   You can test manually with: bun run test:carbon-api', 'yellow');
    }
    
    log('\n📖 For more information, see: docs/CARBON_API_SETUP.md', 'cyan');
    
  } catch (error) {
    log(`\n💥 Setup error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
main();
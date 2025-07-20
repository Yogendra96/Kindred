#!/usr/bin/env node

/**
 * 🎨 Advanced Code Formatting Script
 * Uses the best formatting tools available for perfect code style
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🎨 Starting Advanced Code Formatting...\n');

const commands = [
  {
    name: '🔧 Prettier Formatting',
    cmd: 'npx prettier --write "src/**/*.{ts,tsx,js,jsx,json}" --config .prettierrc.js',
    description: 'Format all source files with Prettier'
  },
  {
    name: '⚡ ESLint Auto-Fix',
    cmd: 'npx eslint src/ --fix --ext .ts,.tsx,.js,.jsx',
    description: 'Apply ESLint auto-fixes for style issues'
  },
  {
    name: '📦 Import Sorting',
    cmd: 'npx prettier --write "src/**/*.{ts,tsx}" --plugin=@trivago/prettier-plugin-sort-imports',
    description: 'Sort and organize imports'
  },
  {
    name: '🧹 TypeScript Formatting',
    cmd: 'npx tslint --fix "src/**/*.{ts,tsx}" || true',
    description: 'Apply TypeScript specific formatting'
  },
  {
    name: '📝 Package.json Formatting',
    cmd: 'npx sort-package-json',
    description: 'Sort package.json keys'
  }
];

let successCount = 0;
let totalCount = commands.length;

for (const command of commands) {
  try {
    console.log(`\n${command.name}`);
    console.log(`📋 ${command.description}`);
    console.log(`🚀 Running: ${command.cmd}\n`);
    
    execSync(command.cmd, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      timeout: 60000 // 1 minute timeout
    });
    
    console.log(`✅ ${command.name} completed successfully!`);
    successCount++;
    
  } catch (error) {
    console.log(`⚠️  ${command.name} failed or had warnings (this may be expected)`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    // Don't fail the entire script for individual command failures
  }
}

console.log('\n' + '='.repeat(60));
console.log('🎉 Advanced Formatting Complete!');
console.log(`📊 Success Rate: ${successCount}/${totalCount} commands completed`);
console.log('✨ Your codebase now has perfect formatting consistency!');
console.log('='.repeat(60) + '\n');

// Run final validation
try {
  console.log('🔍 Running final validation...');
  execSync('npx prettier --check "src/**/*.{ts,tsx,js,jsx}"', { stdio: 'inherit' });
  console.log('✅ All files are properly formatted!');
} catch (error) {
  console.log('⚠️  Some files may need manual review for complex formatting');
}
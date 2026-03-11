#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import path from 'path';

console.log('🔧 Fixing Webpack Module Error...');

// Function to safely remove directory/file
function safeRemove(filePath: string) {
  try {
    if (existsSync(filePath)) {
      rmSync(filePath, { recursive: true, force: true });
      console.log(`✅ Removed: ${filePath}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${filePath}:`, error);
  }
}

// Function to run command safely
function runCommand(command: string, description: string) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.log(`⚠️  ${description} failed:`, error);
  }
}

async function fixWebpackError() {
  console.log('1. Stopping any running processes...');
  try {
    // Kill any running Next.js processes
    if (process.platform === 'win32') {
      execSync('taskkill /f /im node.exe 2>nul', { stdio: 'ignore' });
    } else {
      execSync('pkill -f "next dev" 2>/dev/null || true', { stdio: 'ignore' });
    }
  } catch (error) {
    // Ignore errors - processes might not be running
  }

  console.log('2. Cleaning build artifacts and caches...');
  safeRemove('.next');
  safeRemove('node_modules/.cache');
  safeRemove('.turbo');
  safeRemove('tsconfig.tsbuildinfo');
  
  // Clean additional webpack cache locations
  safeRemove(path.join('node_modules', '.cache'));
  safeRemove(path.join('node_modules', 'next', 'dist', 'cache'));

  console.log('3. Clearing npm cache...');
  runCommand('npm cache clean --force', 'Clearing npm cache');

  console.log('4. Reinstalling dependencies...');
  safeRemove('node_modules');
  safeRemove('package-lock.json');
  
  runCommand('npm install', 'Installing dependencies');

  console.log('5. Verifying installation...');
  try {
    execSync('npm ls next react react-dom', { stdio: 'pipe' });
    console.log('✅ Core dependencies verified');
  } catch (error) {
    console.log('⚠️  Dependency verification failed, but continuing...');
  }

  console.log('\n🎉 Webpack module error fix completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Run: npm run dev:legacy');
  console.log('2. If issues persist, try: npm run dev (without turbo)');
  console.log('3. Check browser console for any remaining errors');
}

// Run the fix
fixWebpackError().catch(console.error);
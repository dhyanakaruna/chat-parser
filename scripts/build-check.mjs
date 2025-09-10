#!/usr/bin/env node

/**
 * Build check script for Vercel deployment
 * Ensures all necessary checks pass before deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Running pre-deployment checks...\n');

// Check if required environment variables are documented
const envExamplePath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.warn('⚠️  Warning: .env.example file not found');
} else {
  console.log('✅ .env.example file exists');
}

// Check if vercel.json exists
const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
if (!fs.existsSync(vercelConfigPath)) {
  console.error('❌ vercel.json file not found');
  process.exit(1);
} else {
  console.log('✅ vercel.json configuration exists');
}

// Check if next.config.ts exists and is properly configured
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (!fs.existsSync(nextConfigPath)) {
  console.error('❌ next.config.ts file not found');
  process.exit(1);
} else {
  console.log('✅ next.config.ts configuration exists');
}

// Run TypeScript type checking
try {
  console.log('🔍 Running TypeScript type check...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript type check passed');
} catch {
  console.error('❌ TypeScript type check failed');
  process.exit(1);
}

// Run ESLint
try {
  console.log('🔍 Running ESLint...');
  execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0', { stdio: 'inherit' });
  console.log('✅ ESLint check passed');
} catch {
  console.error('❌ ESLint check failed');
  process.exit(1);
}

// Check package.json scripts
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredScripts = ['build', 'start', 'lint', 'type-check'];
const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

if (missingScripts.length > 0) {
  console.error(`❌ Missing required scripts: ${missingScripts.join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ All required scripts present in package.json');
}

// Check dependencies
const requiredDeps = ['next', 'react', 'react-dom', 'mongodb', 'openai'];
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.error(`❌ Missing required dependencies: ${missingDeps.join(', ')}`);
  process.exit(1);
} else {
  console.log('✅ All required dependencies present');
}

console.log('\n🎉 All pre-deployment checks passed!');
console.log('🚀 Ready for Vercel deployment');

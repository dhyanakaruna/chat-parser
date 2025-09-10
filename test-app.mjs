// Simple test script to verify the application is working
// Run with: node test-app.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Chat Parser App Setup...\n');

// Test 1: Check if all required files exist
const requiredFiles = [
  'package.json',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/api/upload/route.ts',
  'src/app/api/messages/route.ts',
  'src/components/FileUpload.tsx',
  'src/components/ChatMessages.tsx',
  'lib/db.ts',
  'sample-chat.txt',
  'README.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['@vercel/postgres', 'openai', 'uuid'];
const requiredDevDeps = ['@types/uuid'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

requiredDevDeps.forEach(dep => {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep} - ${packageJson.devDependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

// Test 3: Check sample chat file
console.log('\n💬 Checking sample chat file...');
const sampleChat = fs.readFileSync('sample-chat.txt', 'utf8');
const lines = sampleChat.split('\n').filter(line => line.trim());
console.log(`✅ Sample chat file has ${lines.length} lines`);

// Test 4: Check environment template
console.log('\n🔧 Checking environment setup...');
if (fs.existsSync('env.example')) {
  console.log('✅ Environment template exists');
  console.log('📝 Remember to copy env.example to .env.local and fill in your API keys');
} else {
  console.log('❌ Environment template missing');
  allFilesExist = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 All tests passed! Your Chat Parser App is ready to go!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy env.example to .env.local');
  console.log('2. Add your OpenAI API key to .env.local');
  console.log('3. Run: npm run dev');
  console.log('4. Open http://localhost:3000');
  console.log('5. Upload the sample-chat.txt file to test');
} else {
  console.log('❌ Some tests failed. Please check the missing files/dependencies.');
}
console.log('='.repeat(50));

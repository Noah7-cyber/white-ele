#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Deployment Configuration Locally\n');

// Test 1: Check if required files exist
console.log('1. Checking required files...');
const requiredFiles = [
  'package.json',
  '.github/workflows/deploy.yml',
  'ecosystem.config.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
  }
});

// Test 2: Validate package.json
console.log('\n2. Validating package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   ✅ Valid JSON`);
  console.log(`   ✅ Name: ${pkg.name}`);
  console.log(`   ✅ Version: ${pkg.version}`);
  
  // Check for required scripts
  const requiredScripts = ['build', 'start'];
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`   ✅ Script "${script}": ${pkg.scripts[script]}`);
    } else {
      console.log(`   ⚠️  Script "${script}" not found`);
    }
  });
  
  if (pkg.scripts && pkg.scripts['migration:run']) {
    console.log(`   ✅ Migration script found: ${pkg.scripts['migration:run']}`);
  } else {
    console.log(`   ℹ️  No migration script found (optional)`);
  }
} catch (error) {
  console.log(`   ❌ Invalid package.json: ${error.message}`);
}

// Test 3: Validate ecosystem.config.js
console.log('\n3. Validating ecosystem.config.js...');
try {
  const ecosystemPath = path.resolve('ecosystem.config.js');
  delete require.cache[ecosystemPath];
  const ecosystem = require(ecosystemPath);
  
  if (ecosystem.apps && Array.isArray(ecosystem.apps) && ecosystem.apps.length > 0) {
    console.log(`   ✅ Valid ecosystem config`);
    const app = ecosystem.apps[0];
    console.log(`   ✅ App name: ${app.name}`);
    console.log(`   ✅ Script: ${app.script}`);
    console.log(`   ✅ Instances: ${app.instances}`);
  } else {
    console.log(`   ❌ Invalid ecosystem config structure`);
  }
} catch (error) {
  console.log(`   ❌ Error loading ecosystem.config.js: ${error.message}`);
}

// Test 4: Test build process
console.log('\n4. Testing build process...');
try {
  console.log('   Installing dependencies...');
  execSync('npm ci', { stdio: 'pipe' });
  console.log('   ✅ Dependencies installed');
  
  console.log('   Running build...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('   ✅ Build successful');
  
  // Check if build output exists
  if (fs.existsSync('dist') || fs.existsSync('build')) {
    console.log('   ✅ Build output directory found');
  } else {
    console.log('   ⚠️  No build output directory found');
  }
} catch (error) {
  console.log(`   ❌ Build failed: ${error.message}`);
}

// Test 5: Simulate deployment package creation
console.log('\n5. Testing deployment package creation...');
try {
  // Clean up any existing deploy directory
  if (fs.existsSync('deploy')) {
    fs.rmSync('deploy', { recursive: true, force: true });
  }
  
  fs.mkdirSync('deploy');
  
  // Copy files as the workflow would
  if (fs.existsSync('dist')) {
    fs.cpSync('dist', 'deploy/dist', { recursive: true });
    console.log('   ✅ Copied dist directory');
  }
  
  if (fs.existsSync('build')) {
    fs.cpSync('build', 'deploy/build', { recursive: true });
    console.log('   ✅ Copied build directory');
  }
  
  fs.copyFileSync('package.json', 'deploy/package.json');
  console.log('   ✅ Copied package.json');
  
  if (fs.existsSync('package-lock.json')) {
    fs.copyFileSync('package-lock.json', 'deploy/package-lock.json');
    console.log('   ✅ Copied package-lock.json');
  }
  
  if (fs.existsSync('ecosystem.config.js')) {
    fs.copyFileSync('ecosystem.config.js', 'deploy/ecosystem.config.js');
    console.log('   ✅ Copied ecosystem.config.js');
  }
  
  // Create tar.gz (simulate)
  console.log('   ✅ Deployment package structure ready');
  
  // Show what would be deployed
  console.log('\n   📦 Deployment package contents:');
  const deployContents = fs.readdirSync('deploy', { recursive: true });
  deployContents.forEach(item => {
    console.log(`      - ${item}`);
  });
  
  // Clean up
  fs.rmSync('deploy', { recursive: true, force: true });
  
} catch (error) {
  console.log(`   ❌ Package creation failed: ${error.message}`);
}

console.log('\n🎉 Local testing completed!');
console.log('\nNext steps:');
console.log('1. Fix any issues shown above');
console.log('2. Set up your GitHub secrets (EC2_HOST, EC2_USER, EC2_SSH_KEY)');
console.log('3. Create a test-deployment branch and push to test');
console.log('4. Use the test workflow before deploying to production');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking SSL Certificate Setup...\n');

const sslDir = path.join(__dirname, 'ssl');
const requiredFiles = [
  'thepractrack.key',
  'thepractrack_com.crt', 
  'gd_bundle-g2-g1.crt'
];

// Check if SSL directory exists
if (!fs.existsSync(sslDir)) {
  console.log('❌ SSL directory not found. Creating...');
  fs.mkdirSync(sslDir);
  console.log('✅ SSL directory created.');
} else {
  console.log('✅ SSL directory exists.');
}

console.log('\n📁 Checking for required certificate files:');

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(sslDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 All SSL certificates found!');
  console.log('🚀 You can now run: npm run dev:https');
  console.log('🌐 Access your app at: https://www.thepractrack.com:3000');
} else {
  console.log('⚠️  Missing SSL certificates.');
  console.log('📋 Please download your certificates from GoDaddy and place them in the ssl/ directory.');
  console.log('📖 See SSL_SETUP.md for detailed instructions.');
}

console.log('\n🔒 Security Reminder:');
console.log('   This setup exposes your local development server to the internet.');
console.log('   Consider deploying to a proper hosting platform for production use.');

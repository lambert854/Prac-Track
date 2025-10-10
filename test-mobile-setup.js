#!/usr/bin/env node

const http = require('http');

const localIP = '192.168.50.194';
const port = 3000;

console.log('🧪 Testing mobile setup...');
console.log(`📍 Testing connection to http://${localIP}:${port}`);

const options = {
  hostname: localIP,
  port: port,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is running! Status: ${res.statusCode}`);
  console.log(`🌐 Mobile access URL: http://${localIP}:${port}`);
  console.log('\n📱 Next steps:');
  console.log('1. Open Cursor Mobile on your device');
  console.log('2. Connect to the same WiFi network');
  console.log(`3. Navigate to: http://${localIP}:${port}`);
console.log('\n👤 Demo login credentials:');
console.log('   Admin: admin@demo.edu / Passw0rd!');
console.log('   Faculty: faculty1@demo.edu / Passw0rd!');
console.log('   Supervisor: supervisor1@demo.edu / Passw0rd!');
console.log('   Student: student1@demo.edu / Passw0rd!');
  process.exit(0);
});

req.on('error', (err) => {
  console.log('❌ Server is not responding. Make sure to run: npm run dev:mobile');
  console.log('Error:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('⏰ Connection timeout. Make sure to run: npm run dev:mobile');
  process.exit(1);
});

req.end();

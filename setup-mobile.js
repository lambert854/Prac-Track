#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');

console.log('🚀 Setting up FieldTrack for Mobile Development...\n');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log(`📍 Your local IP address: ${localIP}`);
console.log(`🌐 Mobile access URL: http://${localIP}:3000\n`);

// Create .env.local if it doesn't exist
const envPath = '.env.local';
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envContent = `# Development Environment Variables
NEXTAUTH_URL=http://${localIP}:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Database
DATABASE_URL="file:./dev.db"

# Email Configuration (for development)
RESEND_API_KEY=your-resend-api-key-here

# Development Settings
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local created successfully\n');
} else {
  console.log('✅ .env.local already exists\n');
}

// Run database setup
console.log('🗄️  Setting up database...');
try {
  execSync('npm run db:generate', { stdio: 'inherit' });
  execSync('npm run db:push', { stdio: 'inherit' });
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database setup complete\n');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}

console.log('🎉 Setup complete!');
console.log('\n📱 To start mobile development:');
console.log('   npm run dev:mobile');
console.log('\n📱 Then open Cursor Mobile and connect to:');
console.log(`   http://${localIP}:3000`);
console.log('\n👤 Demo login credentials:');
console.log('   Admin: admin@example.com / admin123');
console.log('   Student: student@example.com / student123');
console.log('   Faculty: faculty@example.com / faculty123');
console.log('   Supervisor: supervisor@example.com / supervisor123');

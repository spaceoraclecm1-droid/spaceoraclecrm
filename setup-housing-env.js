#!/usr/bin/env node

/**
 * Housing.com Environment Setup Script
 * Run this script to quickly set up your environment variables
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🏠 Housing.com Environment Setup Script\n');

const credentials = {
  HOUSING_PROFILE_ID: process.env.HOUSING_PROFILE_ID,
  HOUSING_ENCRYPTION_KEY: process.env.HOUSING_ENCRYPTION_KEY,
  CRON_SECRET:
    process.env.CRON_SECRET || `housing-cron-${crypto.randomBytes(24).toString('hex')}`
};

if (!credentials.HOUSING_PROFILE_ID || !credentials.HOUSING_ENCRYPTION_KEY) {
  console.error('❌ Missing credentials. Set HOUSING_PROFILE_ID and HOUSING_ENCRYPTION_KEY in your environment before running this script.');
  process.exit(1);
}

const envLocalPath = path.join(process.cwd(), '.env.local');

// Check if .env.local already exists
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local file already exists');
  console.log('❌ Please remove or backup your existing .env.local file first');
  process.exit(1);
}

// Create .env.local with Housing.com credentials
const envContent = `# Housing.com API Configuration
# Generated on ${new Date().toISOString()}
HOUSING_PROFILE_ID=${credentials.HOUSING_PROFILE_ID}
HOUSING_ENCRYPTION_KEY=${credentials.HOUSING_ENCRYPTION_KEY}

# Cron Security (Optional but Recommended)
CRON_SECRET=${credentials.CRON_SECRET}

# Note: Add your existing Supabase credentials below if not already present
`;

fs.writeFileSync(envLocalPath, envContent);

console.log('✅ Environment variables configured successfully!');
console.log('\n📁 Created .env.local file with:');
console.log('   ✅ HOUSING_PROFILE_ID');
console.log('   ✅ HOUSING_ENCRYPTION_KEY');
console.log('   ✅ CRON_SECRET (generated randomly)');
console.log('\n🔒 Security Notes:');
console.log('   ✅ .env.local is protected by .gitignore');
console.log('   ✅ Do not commit this file to version control');
console.log('   ✅ For production, use Vercel Environment Variables');
console.log('\n🚀 Next Steps:');
console.log('   1. Restart your development server');
console.log('   2. Test the integration: curl http://localhost:3000/api/housing/test');
console.log('   3. Check your CRM for new leads');
console.log('\n📖 For detailed setup, see: ENVIRONMENT_SETUP.md');
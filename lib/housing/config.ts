export const HOUSING_CONFIG = {
  API_URL: 'https://leads.housing.com/api/v0/get-builder-leads',
  PROFILE_ID: process.env.HOUSING_PROFILE_ID || '',
  ENCRYPTION_KEY: process.env.HOUSING_ENCRYPTION_KEY || '',
  FETCH_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  LAST_FETCH_KEY: 'housing_last_fetch_timestamp'
};

// Validation function to ensure credentials are set
export function validateConfig(): boolean {
  if (!HOUSING_CONFIG.PROFILE_ID || !HOUSING_CONFIG.ENCRYPTION_KEY) {
    console.error('[HousingConfig] ❌ Housing.com credentials not configured');
    console.error('[HousingConfig] Please set the following environment variables:');
    console.error('[HousingConfig]   HOUSING_PROFILE_ID=your_profile_id');
    console.error('[HousingConfig]   HOUSING_ENCRYPTION_KEY=your_encryption_key');
    console.error('[HousingConfig]   CRON_SECRET=your_cron_secret (optional)');
    return false;
  }
  console.log(`[HousingConfig] ✅ Profile ID configured: ${HOUSING_CONFIG.PROFILE_ID.substring(0, 4)}...`);
  console.log(`[HousingConfig] ✅ Encryption key configured: ${HOUSING_CONFIG.ENCRYPTION_KEY ? 'SET' : 'NOT SET'}`);
  return true;
}
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
    return false;
  }
  return true;
}
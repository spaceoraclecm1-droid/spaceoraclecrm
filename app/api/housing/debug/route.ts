import { NextRequest, NextResponse } from 'next/server';
import { HOUSING_CONFIG, validateConfig } from '@/lib/housing/config';

export async function GET(request: NextRequest) {
  const isConfigValid = validateConfig();
  
  const debugInfo = {
    environment: process.env.NODE_ENV,
    configStatus: {
      valid: isConfigValid,
      profileId: HOUSING_CONFIG.PROFILE_ID ? `${HOUSING_CONFIG.PROFILE_ID.substring(0, 4)}...` : 'NOT SET',
      encryptionKey: HOUSING_CONFIG.ENCRYPTION_KEY ? 'SET' : 'NOT SET',
      apiUrl: HOUSING_CONFIG.API_URL
    },
    envVars: {
      HOUSING_PROFILE_ID: process.env.HOUSING_PROFILE_ID ? 'SET' : 'NOT SET',
      HOUSING_ENCRYPTION_KEY: process.env.HOUSING_ENCRYPTION_KEY ? 'SET' : 'NOT SET'
    },
    timestamp: new Date().toISOString()
  };

  console.log('[Housing Debug] Configuration status:', debugInfo);

  return NextResponse.json(debugInfo);
}
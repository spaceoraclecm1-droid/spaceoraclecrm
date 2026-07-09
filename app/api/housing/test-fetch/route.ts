import { NextRequest, NextResponse } from 'next/server';
import { HousingService } from '@/lib/housing/housing-service';

export async function POST(request: NextRequest) {
  console.log('[Housing Test Fetch API] Request received');
  
  try {
    const body = await request.json();
    const daysBack = body.daysBack || 30; // Default to 30 days if not specified
    
    console.log(`[Housing Test Fetch API] Fetching leads from last ${daysBack} days`);
    
    const housingService = new HousingService();
    
    // Instead of using last fetch timestamp, use a custom time range
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (daysBack * 24 * 60 * 60); // Go back specified days
    
    console.log(`[Housing Test Fetch API] Time range: ${new Date(startTime * 1000).toISOString()} to ${new Date(endTime * 1000).toISOString()}`);
    
    // Call the test fetch method
    const result = await housingService.testFetchWithTimeRange(startTime, endTime);
    
    console.log('[Housing Test Fetch API] Result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('[Housing Test Fetch API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
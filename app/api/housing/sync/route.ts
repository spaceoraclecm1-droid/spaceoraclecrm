import { NextRequest, NextResponse } from 'next/server';
import { HousingService } from '@/lib/housing/housing-service';

export async function GET(request: NextRequest) {
  
  try {
    const housingService = new HousingService();
    
    const result = await housingService.fetchAndSyncLatestLeads();
    
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hoursBack = body.hoursBack || 24;

    const housingService = new HousingService();
    const result = await housingService.manualFetch(hoursBack);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('API Error:', error);
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
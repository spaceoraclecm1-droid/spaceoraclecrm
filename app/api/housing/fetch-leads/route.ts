import { NextRequest, NextResponse } from 'next/server';
import { HousingService } from '@/lib/housing/housing-service';

export async function GET(request: NextRequest) {
  const requestId = `fetch_${Date.now()}`;

  try {
    console.log(`[${requestId}] 🏠 Fetching latest Housing.com leads for display...`);

    const housingService = new HousingService();

    // Fetch latest leads from last 24 hours (without adding to database)
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (24 * 3600); // 24 hours ago

    const rawLeads = await housingService.apiClient.fetchLeads(
      startTime.toString(),
      endTime.toString()
    );

    console.log(`[${requestId}] 📊 Found ${rawLeads.length} raw leads from Housing.com`);

    // Process the leads but don't add to database
    const processedLeads = rawLeads.map(lead => housingService.apiClient.processLead(lead));

    // Filter out leads that already exist in Supabase (excluding "Deal Lost")
    const filteredLeads = await housingService.filterExistingLeads(processedLeads);

    return NextResponse.json({
      success: true,
      message: `Found ${filteredLeads.length} leads from Housing.com`,
      data: filteredLeads,
      count: filteredLeads.length,
      timestamp: new Date().toISOString(),
      requestId: requestId
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error fetching Housing leads:`, error);

    return NextResponse.json(
      {
        success: false,
        message: `Error fetching Housing leads: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestId: requestId
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = `add_${Date.now()}`;

  try {
    console.log(`[${requestId}] 🏠 Adding Housing leads to Supabase...`);

    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid leads data provided',
          requestId: requestId
        },
        { status: 400 }
      );
    }

    const housingService = new HousingService();

    // Process and add leads to Supabase
    const syncResult = await housingService.addLeadsToSupabase(leads);

    console.log(`[${requestId}] ✅ Added leads to Supabase:`, syncResult);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${syncResult.inserted} leads to Supabase`,
      data: syncResult,
      timestamp: new Date().toISOString(),
      requestId: requestId
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error adding leads to Supabase:`, error);

    return NextResponse.json(
      {
        success: false,
        message: `Error adding leads to Supabase: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestId: requestId
      },
      { status: 500 }
    );
  }
}
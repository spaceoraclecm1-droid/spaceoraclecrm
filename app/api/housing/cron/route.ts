import { NextRequest, NextResponse } from 'next/server';
import { HousingService } from '@/lib/housing/housing-service';

// This endpoint can be called by external cron services like Vercel Cron,
// GitHub Actions, or any scheduled task service

export async function GET(request: NextRequest) {
  const startTime = new Date();
  const requestId = `cron_${startTime.getTime()}`;

  try {

    // Optional: Add authentication check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          requestId: requestId,
          timestamp: startTime.toISOString()
        },
        { status: 401 }
      );
    }


    const housingService = new HousingService();
    const result = await housingService.fetchAndSyncLatestLeads();

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`[${requestId}] Results: success=${result.success}, duration=${duration}ms`);

    // Log detailed results for debugging
    if (result.stats) {
      console.log(`[${requestId}] Stats: fetched=${result.stats.fetched}, inserted=${result.stats.inserted}`);
    }

    // Log any errors from individual lead processing
    if (result.details) {
      const errors = result.details.filter((d: any) => d.status === 'error');
      const skipped = result.details.filter((d: any) => d.status === 'skipped');

      if (errors.length > 0) {
        console.log(`[${requestId}] ⚠️ Leads with errors:`, errors.length);
        errors.forEach((error: any, index: number) => {
          console.log(`[${requestId}]   Error ${index + 1}:`, {
            clientName: error.lead.clientName,
            mobile: error.lead.mobile,
            error: error.error
          });
        });
      }

      if (skipped.length > 0) {
        console.log(`[${requestId}] ⏭️ Leads skipped (duplicates):`, skipped.length);
        skipped.forEach((skip: any, index: number) => {
          console.log(`[${requestId}]   Skipped ${index + 1}:`, {
            clientName: skip.lead.clientName,
            mobile: skip.lead.mobile,
            reason: skip.error
          });
        });
      }
    }

    return NextResponse.json({
      ...result,
      requestId: requestId,
      timestamp: startTime.toISOString(),
      duration: `${duration}ms`,
      executionTime: {
        started: startTime.toISOString(),
        completed: endTime.toISOString()
      }
    }, {
      status: result.success ? 200 : 500
    });

  } catch (error) {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.error(`[${requestId}] [${endTime.toISOString()}] ❌ Cron job failed after ${duration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
        requestId: requestId,
        timestamp: startTime.toISOString(),
        duration: `${duration}ms`,
        executionTime: {
          started: startTime.toISOString(),
          failed: endTime.toISOString()
        }
      },
      { status: 500 }
    );
  }
}
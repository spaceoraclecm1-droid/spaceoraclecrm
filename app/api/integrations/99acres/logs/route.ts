import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { NINETY_NINE_ACRES_CONFIG } from '@/lib/ninety-nine-acres/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns the most recent integration logs for the 99acres integration.
 * Supports ?id=<uuid> to fetch a single row by id (for the row-expansion panel).
 *
 * NOTE: This endpoint is gated by Supabase RLS. We expect an authenticated
 * service-role client on the server side; the per-row anon SELECT in the
 * `integration_logs` table must be restricted to authenticated users (see
 * setup_99acres.sql).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200);

  if (id) {
    const { data, error } = await supabase
      .from(NINETY_NINE_ACRES_CONFIG.LOG_TABLE)
      .select('*')
      .eq('integration_name', NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE)
      .eq('id', id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  }

  const { data, error } = await supabase
    .from(NINETY_NINE_ACRES_CONFIG.LOG_TABLE)
    .select(
      'id, status_code, lead_name, phone, project, source, ip_address, response_time_ms, error_message, method, endpoint, created_at'
    )
    .eq('integration_name', NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

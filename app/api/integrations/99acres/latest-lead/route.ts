import { NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import { NINETY_NINE_ACRES_CONFIG } from '@/lib/ninety-nine-acres/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Returns the most recent 99acres enquiry row from `enquiries`, or `null`
 * if no 99acres lead has been ingested yet. Powers the "Latest 99acres Lead"
 * panel on the integration settings page.
 *
 * NOTE: gated by Supabase RLS — see setup_99acres.sql. The enquiry rows are
 * readable by the same anon key the rest of the CRM uses.
 */
export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabase
    .from(NINETY_NINE_ACRES_CONFIG.ENQUIRY_TABLE)
    .select('*')
    .eq('Enquiry Source', NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}

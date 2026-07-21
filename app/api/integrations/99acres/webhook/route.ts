import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/utils/supabase';
import {
  NINETY_NINE_ACRES_CONFIG,
  isAuthConfigured,
  verifyBearer,
} from '@/lib/ninety-nine-acres/config';
import { map99AcresLead } from '@/lib/ninety-nine-acres/lead-mapper';
import { phonesMatch } from '@/lib/lead-mapper';
import { clientIp, safeHeaders } from '@/lib/http';
import type { IntegrationLogRow } from '@/lib/ninety-nine-acres/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SOURCE = NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE;
const ENDPOINT = NINETY_NINE_ACRES_CONFIG.WEBHOOK_PATH;

type LogEntry = Partial<IntegrationLogRow>;

function buildLogEntry(
  statusCode: number,
  startedAt: number,
  extra: Omit<LogEntry, 'status_code' | 'response_time_ms'>
): LogEntry {
  return {
    integration_name: SOURCE,
    method: 'POST',
    endpoint: ENDPOINT,
    status_code: statusCode,
    response_time_ms: Date.now() - startedAt,
    ...extra,
  };
}

/**
 * Best-effort logging — failures are swallowed so logging problems can't
 * break the webhook. Called with `void` so the response isn't held back by
 * an awaited Supabase round-trip.
 */
function logRequest(entry: LogEntry): void {
  void supabase
    .from(NINETY_NINE_ACRES_CONFIG.LOG_TABLE)
    .insert(entry)
    .then(({ error }) => {
      if (error) console.error('[99acres-webhook] logging failed:', error.message);
    });
}

/**
 * Pre-insert dedupe. The webhook may be retried by 99acres' partner system,
 * so blocking a second insert of the same lead by mobile keeps the enquiry
 * table clean.
 */
async function isDuplicate(mobile: string): Promise<boolean> {
  if (!mobile) return false;
  const digits = mobile.replace(/[^0-9]/g, '');
  if (digits.length < 10) return false;
  const last10 = digits.slice(-10);
  const variations = [
    last10,
    `0${last10}`,
    `91${last10}`,
    `+91${last10}`,
    `+91 ${last10}`,
  ];

  const { data, error } = await supabase
    .from(NINETY_NINE_ACRES_CONFIG.ENQUIRY_TABLE)
    .select('Mobile')
    .in('Mobile', variations)
    .neq('Enquiry Progress', 'Deal Lost');

  if (error) {
    console.error('[99acres-webhook] dedupe check failed:', error.message);
    return false;
  }
  return (data ?? []).some((row) => phonesMatch(mobile, row.Mobile ?? ''));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const ip = clientIp(request);
  const safeHeaderSet = NINETY_NINE_ACRES_CONFIG.HEADERS_TO_LOG;

  if (isAuthConfigured()) {
    const auth = request.headers.get('authorization');
    if (!verifyBearer(auth)) {
      logRequest(
        buildLogEntry(401, startedAt, {
          request_headers: safeHeaders(request, safeHeaderSet),
          ip_address: ip,
          error_message: 'Missing or invalid bearer token',
          source: SOURCE,
        })
      );
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch (err) {
    logRequest(
      buildLogEntry(400, startedAt, {
        request_headers: safeHeaders(request, safeHeaderSet),
        ip_address: ip,
        error_message: `Could not read body: ${String(err)}`,
        source: SOURCE,
      })
    );
    return NextResponse.json(
      { success: false, message: 'Could not read request body' },
      { status: 400 }
    );
  }

  if (rawText.length > NINETY_NINE_ACRES_CONFIG.MAX_PAYLOAD_BYTES) {
    logRequest(
      buildLogEntry(413, startedAt, {
        request_headers: safeHeaders(request, safeHeaderSet),
        ip_address: ip,
        error_message: `Payload too large: ${rawText.length} bytes`,
        source: SOURCE,
      })
    );
    return NextResponse.json(
      { success: false, message: 'Payload too large' },
      { status: 413 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = rawText.length === 0 ? {} : (JSON.parse(rawText) as Record<string, unknown>);
  } catch (err) {
    logRequest(
      buildLogEntry(400, startedAt, {
        request_headers: safeHeaders(request, safeHeaderSet),
        request_body: rawText,
        ip_address: ip,
        error_message: `Invalid JSON: ${String(err)}`,
        source: SOURCE,
      })
    );
    return NextResponse.json(
      { success: false, message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { row, processed } = map99AcresLead(payload, rawText);

  if (await isDuplicate(processed.mobile)) {
    logRequest(
      buildLogEntry(409, startedAt, {
        request_headers: safeHeaders(request, safeHeaderSet),
        request_body: rawText,
        ip_address: ip,
        lead_name: processed.clientName,
        phone: processed.mobile,
        project: processed.enquiryFor,
        error_message: 'Duplicate lead (active mobile already exists)',
        source: SOURCE,
      })
    );
    return NextResponse.json(
      { success: false, message: 'Duplicate lead' },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from(NINETY_NINE_ACRES_CONFIG.ENQUIRY_TABLE)
    .insert(row)
    .select('id')
    .single();

  if (insertErr) {
    logRequest(
      buildLogEntry(500, startedAt, {
        request_headers: safeHeaders(request, safeHeaderSet),
        request_body: rawText,
        ip_address: ip,
        lead_name: processed.clientName,
        phone: processed.mobile,
        project: processed.enquiryFor,
        error_message: insertErr.message,
        source: SOURCE,
      })
    );
    return NextResponse.json(
      { success: false, message: insertErr.message, error: insertErr.message },
      { status: 500 }
    );
  }

  if (!inserted) {
    logRequest(
      buildLogEntry(500, startedAt, {
        request_headers: safeHeaders(request, safeHeaderSet),
        request_body: rawText,
        ip_address: ip,
        lead_name: processed.clientName,
        phone: processed.mobile,
        project: processed.enquiryFor,
        error_message: 'Insert returned no row',
        source: SOURCE,
      })
    );
    return NextResponse.json(
      { success: false, message: 'Insert failed: no row returned' },
      { status: 500 }
    );
  }

  const responseBody = JSON.stringify({
    success: true,
    message: 'Lead received successfully',
    leadId: inserted.id,
  });
  logRequest(
    buildLogEntry(200, startedAt, {
      request_headers: safeHeaders(request, safeHeaderSet),
      request_body: rawText,
      ip_address: ip,
      lead_name: processed.clientName,
      phone: processed.mobile,
      project: processed.enquiryFor,
      response_body: responseBody,
      source: SOURCE,
    })
  );

  return new NextResponse(responseBody, {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(
    new URL('/settings/integrations/99acres', request.url),
    301
  );
}
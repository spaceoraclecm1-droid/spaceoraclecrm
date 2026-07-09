import { NextRequest, NextResponse } from 'next/server';
import {
  NINETY_NINE_ACRES_CONFIG,
  buildBearerHeader,
} from '@/lib/ninety-nine-acres/config';
import { SAMPLE_99ACRES_PAYLOAD } from '@/lib/ninety-nine-acres/sample-payload';
import { tryParseJson } from '@/lib/http';

/**
 * Server-side self-call to the webhook for the "Test Lead" button. The
 * actual lead creation is performed by the webhook itself, so this is
 * purely a thin launcher. Accepts optional overrides via JSON body.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildSelfUrl(request: NextRequest): string {
  // Prefer the explicit env override (so this also works behind a proxy),
  // otherwise mirror the inbound request origin.
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return `${explicit.replace(/\/$/, '')}${NINETY_NINE_ACRES_CONFIG.WEBHOOK_PATH}`;

  const url = new URL(request.url);
  return `${url.origin}${NINETY_NINE_ACRES_CONFIG.WEBHOOK_PATH}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();

  let overrides: Record<string, unknown> = {};
  try {
    const body = await request.json();
    if (body && typeof body === 'object') {
      overrides = body as Record<string, unknown>;
    }
  } catch {
    // No body is fine — use the defaults.
  }

  const payload = { ...SAMPLE_99ACRES_PAYLOAD, ...overrides };
  const url = buildSelfUrl(request);

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-test-source': '99acres-crm-test-button',
    ...buildBearerHeader(),
  };

  let responseStatus = 0;
  let responseBody = '';
  let requestBody = JSON.stringify(payload);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody,
      // Cache-bust so Vercel doesn't serve a prior response during a re-test.
      cache: 'no-store',
    });
    responseStatus = resp.status;
    responseBody = await resp.text();
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: 'Test send failed',
        error: String(err),
        elapsedMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }

  const elapsed = Date.now() - startedAt;
  return NextResponse.json({
    success: responseStatus === 200,
    status: responseStatus,
    request: { url, headers, body: payload },
    response: tryParseJson(responseBody),
    elapsedMs: elapsed,
  });
}

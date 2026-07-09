import { NextRequest } from 'next/server';

/**
 * Resolve client IP from common proxy headers. Returns 'unknown' when no
 * signal is present rather than throwing.
 */
export function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

/**
 * Convert a NextRequest's Headers into a plain object. Used when we want to
 * persist headers in JSONB log rows.
 */
export function headersToObject(request: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/**
 * Same as headersToObject but filtered to a whitelist and redacted of any
 * Authorization-like headers. Keeps the integration_logs JSONB column small.
 */
export function safeHeaders(
  request: NextRequest,
  whitelist: readonly string[]
): Record<string, string> {
  const set = new Set(whitelist.map((h) => h.toLowerCase()));
  const out: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith('authorization')) return;
    if (set.has(key.toLowerCase())) out[key] = value;
  });
  return out;
}

export function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
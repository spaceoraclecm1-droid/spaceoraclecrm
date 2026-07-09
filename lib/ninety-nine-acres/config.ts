/**
 * 99acres integration configuration.
 *
 * Bearer token is optional — if unset, the webhook accepts unauthenticated POSTs
 * (suitable for development + internal demo). Set NINETY_NINE_ACRES_BEARER_TOKEN
 * before handing the URL off to the 99acres team so they can sign requests.
 */
export const NINETY_NINE_ACRES_CONFIG = {
  USERNAME: process.env.NINETY_NINE_ACRES_USERNAME || 'ORACE01',
  PROFILE_ID: process.env.NINETY_NINE_ACRES_PROFILE_ID || '102498084',
  BEARER_TOKEN: process.env.NINETY_NINE_ACRES_BEARER_TOKEN || '',
  DEFAULT_SOURCE: '99acres',
  RAW_PAYLOAD_COLUMN: '99acres_raw_payload',
  WEBHOOK_PATH: '/api/integrations/99acres/webhook',
  LOG_TABLE: 'integration_logs',
  ENQUIRY_TABLE: 'enquiries',
  MAX_PAYLOAD_BYTES: 64 * 1024,
  BEARER_PREFIX: 'Bearer ',
  HEADERS_TO_LOG: ['content-type', 'user-agent', 'x-forwarded-for'],
} as const;

export function isAuthConfigured(): boolean {
  return NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN.length > 0;
}

/**
 * Constant-time bearer-token comparison. Length-equalised xor so we don't
 * leak the configured prefix length via early returns.
 */
export function verifyBearer(headerValue: string | null): boolean {
  const expected = NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN;
  if (!expected) return true;
  if (!headerValue) return false;

  const prefix = NINETY_NINE_ACRES_CONFIG.BEARER_PREFIX;
  if (!headerValue.startsWith(prefix)) return false;

  const presented = headerValue.slice(prefix.length);
  if (presented.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ presented.charCodeAt(i);
  }
  return mismatch === 0;
}

export function buildBearerHeader(): Record<string, string> {
  if (!NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN) return {};
  return { authorization: `${NINETY_NINE_ACRES_CONFIG.BEARER_PREFIX}${NINETY_NINE_ACRES_CONFIG.BEARER_TOKEN}` };
}

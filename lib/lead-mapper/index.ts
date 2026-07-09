/**
 * Helpers shared by every inbound lead integration (Housing, 99acres, future).
 * Each integration owns its own alias lists and row source label, but the
 * primitives — picking aliases, normalising phones, parsing lead dates,
 * formatting enquiry dates — live here so they don't drift.
 */

export interface ProcessedLead {
  clientName: string;
  mobile: string;
  email: string;
  configuration: string;
  enquiryFor: string;
  propertyType: string;
  assignedTo: string;
  createdDate: string;
  enquiryProgress: string;
  budget: string;
  nfd: string;
  enquirySource: string;
  area: string;
  remarks: string;
}

export function pickString(payload: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const raw = payload[key];
    if (raw === undefined || raw === null) continue;
    const s = String(raw).trim();
    if (s.length > 0) return s;
  }
  return '';
}

export function cleanMobile(raw: string): string {
  return raw.replace(/[\s\-()]/g, '').trim();
}

/**
 * 99acres / Housing send lead_date in seconds OR milliseconds OR an ISO string.
 * 10-digit epoch = seconds, 13-digit epoch = ms; non-numeric falls back to Date.parse.
 */
export function parseLeadDate(input: string): Date | null {
  if (!input) return null;
  if (/^\d+$/.test(input)) {
    const ms = input.length <= 10 ? Number(input) * 1000 : Number(input);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatEnquiryDate(date: Date | null): string {
  return (date ?? new Date()).toLocaleDateString('en-GB');
}

/**
 * Last-10-digit phone match. Used for dedupe between integrations where
 * Housing sends `9876543210`, 99acres sends `+91 9876543210`, the DB has
 * `919876543210`, etc.
 */
export function phonesMatch(a: string, b: string): boolean {
  const a1 = a.replace(/[^0-9]/g, '');
  const b1 = b.replace(/[^0-9]/g, '');
  if (!a1 || !b1) return false;
  if (a1 === b1) return true;
  const a10 = a1.slice(-10);
  const b10 = b1.slice(-10);
  return a10.length === 10 && b10.length === 10 && a10 === b10;
}
import {
  ProcessedLead,
  cleanMobile,
  formatEnquiryDate,
  parseLeadDate,
  pickString,
} from '@/lib/lead-mapper';
import { NINETY_NINE_ACRES_CONFIG } from './config';

export const FIELD_ALIASES = {
  clientName: ['lead_name', 'name', 'customer_name'],
  mobile: ['phone', 'mobile', 'mobile_number', 'lead_phone'],
  email: ['email', 'lead_email'],
  // 99acres sends `property` (often BHK count, sometimes project) and `notes`
  // ($compactLabel — also project-like). Try property first, then notes,
  // then the older Housing-style project/project_name keys.
  enquiryFor: ['property', 'notes', 'project', 'project_name'],
  // 99acres sends a single `address` field formatted as
  // "$localityName, $cityName". Fall back to bare locality/city/area if
  // the partner ever sends those directly.
  area: ['address', 'locality', 'city', 'area'],
  propertyType: ['property_type', 'category_type'],
  budget: ['budget', 'max_price', 'min_price'],
  // `property` from 99acres is usually $bedroomNumBHK (e.g. "3 BHK"), so
  // it's a natural fit for `configuration` too.
  configuration: ['property', 'configuration', 'bhk', 'property_field'],
  // 99acres sends `notes` ($compactLabel) and an always-empty `about`. Keep
  // them in remarks so the project/label isn't dropped.
  message: ['notes', 'message', 'remarks', 'comment', 'about'],
  leadDate: ['lead_date', 'created_at', 'timestamp'],
} as const;

export function map99AcresLead(
  payload: Record<string, unknown>,
  rawJson: string
): { row: Record<string, unknown>; processed: ProcessedLead } {
  const clientName = pickString(payload, FIELD_ALIASES.clientName) || 'Unknown';
  const mobile = cleanMobile(pickString(payload, FIELD_ALIASES.mobile));
  const email = pickString(payload, FIELD_ALIASES.email) || '';
  const enquiryFor = pickString(payload, FIELD_ALIASES.enquiryFor) || 'General Inquiry';
  const propertyType =
    pickString(payload, FIELD_ALIASES.propertyType) || 'Residential';
  const configuration = pickString(payload, FIELD_ALIASES.configuration) || '';
  const area = pickString(payload, FIELD_ALIASES.area) || 'Not specified';
  const budget = pickString(payload, FIELD_ALIASES.budget) || 'Not specified';
  const message = pickString(payload, FIELD_ALIASES.message);
  const leadDate = parseLeadDate(pickString(payload, FIELD_ALIASES.leadDate));

  const formattedDate = formatEnquiryDate(leadDate);

  const remarks =
    message && message.length > 0
      ? `Lead from ${NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE} - ${message}`
      : `Lead from ${NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE} - Project: ${enquiryFor}, Locality: ${area}`;

  const processed: ProcessedLead = {
    clientName,
    mobile,
    email,
    configuration,
    enquiryFor,
    propertyType,
    assignedTo: 'Unassigned',
    createdDate: leadDate ? leadDate.toISOString() : new Date().toISOString(),
    enquiryProgress: 'New',
    budget,
    nfd: '',
    enquirySource: NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE,
    area,
    remarks,
  };

  const row: Record<string, unknown> = {
    'Client Name': clientName,
    Mobile: mobile,
    Email: email || null,
    'Enquiry For': enquiryFor,
    'Property Type': propertyType,
    'Assigned To': 'Unassigned',
    'Created Date': formattedDate,
    'Enquiry Progress': 'New',
    Budget: budget,
    NFD: null,
    'Enquiry Source': NINETY_NINE_ACRES_CONFIG.DEFAULT_SOURCE,
    Area: area,
    Configuration: configuration,
    Remarks: remarks,
    'Last Remarks': remarks,
    'Assigned By': 'System',
    [NINETY_NINE_ACRES_CONFIG.RAW_PAYLOAD_COLUMN]: rawJson,
  };

  return { row, processed };
}
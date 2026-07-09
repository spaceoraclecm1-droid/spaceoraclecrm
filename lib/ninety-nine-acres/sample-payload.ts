/**
 * Canonical sample 99acres lead payload. Imported by the test-send endpoint,
 * the Postman collection generator, and the settings-page UI so all three
 * surfaces agree on what "a real 99acres lead looks like".
 */
export const SAMPLE_99ACRES_PAYLOAD = {
  lead_name: 'Rahul Sharma',
  phone: '9876543210',
  email: 'rahul@example.com',
  project: 'Sky Heights',
  locality: 'Ahmedabad',
  city: 'Ahmedabad',
  budget: '8500000',
  configuration: '3 BHK',
  message: 'Interested in site visit',
  lead_date: '2026-07-04T12:30:00Z',
} as const;

export type Sample99AcresPayload = typeof SAMPLE_99ACRES_PAYLOAD;

export const SAMPLE_PAYLOAD_KEYS = [
  'lead_name',
  'phone',
  'email',
  'project',
  'locality',
  'budget',
  'configuration',
  'message',
  'lead_date',
] as const;

export const SAMPLE_PAYLOAD_LABELS: Record<keyof Sample99AcresPayload, string> = {
  lead_name: 'Lead Name',
  phone: 'Phone',
  email: 'Email',
  project: 'Project',
  locality: 'Locality',
  city: 'City',
  budget: 'Budget',
  configuration: 'Configuration',
  message: 'Message',
  lead_date: 'Lead Date (ISO)',
};
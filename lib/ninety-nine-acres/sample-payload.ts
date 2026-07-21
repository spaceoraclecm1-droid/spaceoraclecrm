/**
 * Canonical sample 99acres lead payload. Imported by the test-send endpoint,
 * the Postman collection generator, and the settings-page UI so all three
 * surfaces agree on what "a real 99acres lead looks like".
 *
 * Shape and key names mirror the partner's confirmed payload (per Sandeep,
 * 99acres Integration Team, 2026-07-21):
 *   {name, phone, email, property ($bedroomNumBHK), budget ($price),
 *    about, address ($localityName, $cityName), notes ($compactLabel)}
 *
 * `about` is always empty in real payloads but kept as a key for parity.
 */
export const SAMPLE_99ACRES_PAYLOAD = {
  name: 'Rahul Sharma',
  phone: '9876543210',
  email: 'rahul@example.com',
  property: '3 BHK',
  budget: '8500000',
  about: '',
  address: 'Andheri West, Mumbai',
  notes: 'Sky Heights',
} as const;

export type Sample99AcresPayload = typeof SAMPLE_99ACRES_PAYLOAD;

export const SAMPLE_PAYLOAD_KEYS = [
  'name',
  'phone',
  'email',
  'property',
  'budget',
  'about',
  'address',
  'notes',
] as const;

export const SAMPLE_PAYLOAD_LABELS: Record<keyof Sample99AcresPayload, string> = {
  name: 'Lead Name',
  phone: 'Phone',
  email: 'Email',
  property: 'Property (BHK)',
  budget: 'Budget',
  about: 'About',
  address: 'Address (Locality, City)',
  notes: 'Notes (Project)',
};

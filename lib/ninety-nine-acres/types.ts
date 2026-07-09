export interface IntegrationLogRow {
  id: string | number;
  integration_name: string;
  method: string;
  endpoint: string;
  status_code: number;
  response_body: string;
  lead_name: string | null;
  phone: string | null;
  project: string | null;
  source: string | null;
  ip_address: string | null;
  response_time_ms: number | null;
  error_message: string | null;
  request_body: string | null;
  request_headers: Record<string, string> | null;
  created_at: string;
}

export interface WebhookResult {
  success: boolean;
  message: string;
  leadId?: string | number;
  error?: string;
}
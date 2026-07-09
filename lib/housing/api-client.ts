import { HOUSING_CONFIG, validateConfig } from './config';
import { generateHousingHash } from './hash-generator';
import { HousingAPIResponse, HousingLeadResponse, ProcessedLead } from './types';

export class HousingAPIClient {
  private profileId: string;
  private encryptionKey: string;
  private apiUrl: string;

  constructor() {
    // Validate configuration on initialization
    if (!validateConfig()) {
      throw new Error('Housing.com API credentials not configured properly');
    }
    
    this.profileId = HOUSING_CONFIG.PROFILE_ID;
    this.encryptionKey = HOUSING_CONFIG.ENCRYPTION_KEY;
    this.apiUrl = HOUSING_CONFIG.API_URL;
  }

  async fetchLeads(startDate: string, endDate: string): Promise<HousingLeadResponse[]> {
    const currentTime = Math.floor(Date.now() / 1000).toString();
    
    console.log('[HousingAPIClient] Generating hash...');
    console.log('[HousingAPIClient] Current time:', currentTime);
    console.log('[HousingAPIClient] Profile ID:', this.profileId ? `${this.profileId.substring(0, 4)}...` : 'NOT SET');
    console.log('[HousingAPIClient] Encryption key:', this.encryptionKey ? 'SET' : 'NOT SET');
    
    const hash = generateHousingHash(this.encryptionKey, currentTime);
    console.log('[HousingAPIClient] Hash generated:', hash.substring(0, 10) + '...');

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      current_time: currentTime,
      hash: hash,
      id: this.profileId
    });

    const url = `${this.apiUrl}?${params.toString()}`;
    console.log('[HousingAPIClient] Full URL:', url.replace(hash, 'HASH_HIDDEN').replace(this.profileId, 'ID_HIDDEN'));
    
    try {
      console.log(`[HousingAPIClient] Fetching Housing leads from ${new Date(parseInt(startDate) * 1000).toISOString()} to ${new Date(parseInt(endDate) * 1000).toISOString()}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('[HousingAPIClient] Response status:', response.status);
      console.log('[HousingAPIClient] Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('[HousingAPIClient] Raw response:', responseText.substring(0, 200));

      let data: HousingAPIResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[HousingAPIClient] Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid JSON response from Housing API: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error('[HousingAPIClient] API request failed:', {
          status: response.status,
          message: data.message,
          data: data
        });
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      // Housing.com might return success without status field
      if (data.status && data.status !== 200) {
        console.error('[HousingAPIClient] API returned non-200 status:', data);
        throw new Error(data.message || 'API returned non-success status');
      }

      // Housing.com returns leads directly as array, not wrapped in data property
      const leads = Array.isArray(data) ? data : data.data || [];
      console.log('[HousingAPIClient] Successfully fetched leads:', leads.length);

      // Log first few leads for debugging
      if (leads.length > 0) {
        console.log('[HousingAPIClient] Sample leads:');
        leads.slice(0, 3).forEach((lead, index) => {
          console.log(`  ${index + 1}. ${lead.lead_name} (${lead.lead_phone}) - ${lead.project_name}`);
        });
      }

      return leads;
    } catch (error) {
      console.error('[HousingAPIClient] Error fetching Housing leads:', error);
      throw error;
    }
  }

  processLead(lead: HousingLeadResponse): ProcessedLead {
    // Format the date from epoch to ISO string
    const createdDate = new Date(parseInt(lead.lead_date) * 1000).toISOString();
    
    // Construct configuration from available data
    const configuration = [
      lead.min_area && lead.max_area ? `${lead.min_area}-${lead.max_area} sqft` : '',
      lead.property_field || '',
      lead.apartment_names || ''
    ].filter(Boolean).join(', ') || 'Not specified';

    // Construct budget from price range if available
    const budget = lead.min_price && lead.max_price 
      ? `₹${lead.min_price} - ₹${lead.max_price}`
      : lead.min_price 
        ? `₹${lead.min_price}+`
        : lead.max_price
          ? `Up to ₹${lead.max_price}`
          : 'Not specified';

    return {
      clientName: lead.lead_name || 'Unknown',
      mobile: lead.lead_phone || '',
      email: lead.lead_email || '',
      configuration: configuration,
      enquiryFor: lead.project_name || 'General Inquiry',
      propertyType: lead.category_type || lead.service_type || 'Residential',
      assignedTo: 'Unassigned', // Will be assigned based on business logic
      createdDate: createdDate,
      enquiryProgress: 'New',
      budget: budget,
      nfd: '', // Next follow-up date, to be set manually
      enquirySource: 'Housing',
      area: lead.locality || lead.city || 'Not specified',
      remarks: `Lead from Housing.com - Project: ${lead.project_name || 'N/A'}, Locality: ${lead.locality || 'N/A'}`
    };
  }

  async fetchLatestLeads(hoursBack: number = 24): Promise<ProcessedLead[]> {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (hoursBack * 3600);

    const leads = await this.fetchLeads(startTime.toString(), endTime.toString());
    return leads.map(lead => this.processLead(lead));
  }
}
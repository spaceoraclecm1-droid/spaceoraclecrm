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
    
    
    const hash = generateHousingHash(this.encryptionKey, currentTime);

    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      current_time: currentTime,
      hash: hash,
      id: this.profileId
    });

    const url = `${this.apiUrl}?${params.toString()}`;
    
    try {
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      
      const responseText = await response.text();

      let data: HousingAPIResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from Housing API: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
          status: response.status,
          message: data.message,
          data: data
        });
        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      // Housing.com might return success without status field
      if (data.status && data.status !== 200) {
        throw new Error(data.message || 'API returned non-success status');
      }

      // Housing.com returns leads directly as array, not wrapped in data property
      const leads = Array.isArray(data) ? data : data.data || [];

      // Log first few leads for debugging
      if (leads.length > 0) {
        leads.slice(0, 3).forEach((lead, index) => {
        });
      }

      return leads;
    } catch (error) {
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
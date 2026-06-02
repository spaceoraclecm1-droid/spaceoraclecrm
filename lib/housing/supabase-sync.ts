import { supabase } from '@/app/utils/supabase';
import { ProcessedLead } from './types';

export class HousingSupabaseSync {
  async checkLeadExists(mobile: string): Promise<boolean> {
    try {
      const raw = mobile.trim();
      const digits = raw.replace(/[^0-9]/g, '');
      const searchVariations = new Set<string>([raw, digits]);

      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        searchVariations.add(last10);
        searchVariations.add(`0${last10}`);
        searchVariations.add(`+91${last10}`);
        searchVariations.add(`91${last10}`);
        searchVariations.add(`+91 ${last10}`);
      }

      // Only check active enquiries; ignore those that are marked as "Deal Lost"
      const { data, error } = await supabase
        .from('enquiries')
        .select('id')
        .in('Mobile', Array.from(searchVariations))
        .neq('Enquiry Progress', 'Deal Lost');

      if (error) {
        console.error('Error checking lead existence:', error);
        return false;
      }

      return !!(data && data.length > 0);
    } catch (error) {
      console.error('Error in checkLeadExists:', error);
      return false;
    }
  }

  async filterExistingLeads(leads: ProcessedLead[]): Promise<ProcessedLead[]> {
    if (leads.length === 0) return [];

    try {
      const searchVariations = new Set<string>();
      leads.forEach(lead => {
        if (!lead.mobile) return;
        const raw = lead.mobile.trim();
        const digits = raw.replace(/[^0-9]/g, '');
        searchVariations.add(raw);
        searchVariations.add(digits);

        if (digits.length >= 10) {
          const last10 = digits.slice(-10);
          searchVariations.add(last10);
          searchVariations.add(`0${last10}`);
          searchVariations.add(`+91${last10}`);
          searchVariations.add(`91${last10}`);
          searchVariations.add(`+91 ${last10}`);
        }
      });

      if (searchVariations.size === 0) return leads;

      // Only query active enquiries; ignore those that are marked as "Deal Lost"
      const { data, error } = await supabase
        .from('enquiries')
        .select('Mobile')
        .in('Mobile', Array.from(searchVariations))
        .neq('Enquiry Progress', 'Deal Lost');

      if (error) {
        console.error('[HousingSupabaseSync] Error checking existing leads:', error);
        return leads;
      }

      const existingMobiles = (data || []).map(item => item.Mobile);

      // Helper function to check if two phone numbers match (comparing last 10 digits)
      const phoneNumbersMatch = (phone1: string, phone2: string): boolean => {
        const clean1 = phone1.replace(/[^0-9]/g, '');
        const clean2 = phone2.replace(/[^0-9]/g, '');
        if (!clean1 || !clean2) return false;
        if (clean1 === clean2) return true;

        const last10_1 = clean1.slice(-10);
        const last10_2 = clean2.slice(-10);
        return last10_1.length === 10 && last10_2.length === 10 && last10_1 === last10_2;
      };

      // Filter out leads that match any active existing mobile number in Supabase
      return leads.filter(lead => {
        const hasMatch = existingMobiles.some(existingMobile =>
          phoneNumbersMatch(lead.mobile, existingMobile)
        );
        return !hasMatch;
      });
    } catch (error) {
      console.error('[HousingSupabaseSync] Error in filterExistingLeads:', error);
      return leads;
    }
  }

  async assignEmployee(area: string): Promise<string> {
    // Logic to auto-assign based on area or round-robin
    // For now, we'll return a default or fetch from a configuration
    const areaAssignments: Record<string, string[]> = {
      'bhopal': ['Rajdeepsinh, Jadeja', 'Maulik, Jadav'],
      'sindhupan': ['Rushirajsinh, Zala'],
      'default': ['Rajdeepsinh, Jadeja', 'Maulik, Jadav', 'Rushirajsinh, Zala']
    };

    const employees = areaAssignments[area.toLowerCase()] || areaAssignments['default'];
    
    // Simple round-robin assignment based on current timestamp
    const index = Math.floor(Date.now() / 1000) % employees.length;
    return employees[index];
  }

  async insertLead(lead: ProcessedLead): Promise<{ id: string | number; success: boolean; error?: string }> {
    try {
      // Validate required fields before proceeding
      if (!lead.clientName || !lead.mobile) {
        const errorMessage = `Lead missing required fields - Client Name: ${lead.clientName}, Mobile: ${lead.mobile}`;
        console.error(errorMessage);
        return { id: '', success: false, error: errorMessage };
      }

      // Clean mobile number format
      const cleanedMobile = lead.mobile.replace(/[\s\-\(\)]/g, '');

      // Check if lead already exists
      const exists = await this.checkLeadExists(lead.mobile);
      if (exists) {
        console.log(`[HousingSupabaseSync] Lead with mobile ${lead.mobile} already exists, skipping...`);
        return { id: '', success: false, error: 'Lead already exists' };
      }

      // Auto-assign employee based on area
      const assignedTo = await this.assignEmployee(lead.area);

      // Format created date to a more readable format if needed
      const formattedDate = new Date(lead.createdDate).toLocaleDateString('en-GB');

      const enquiryData = {
        'Client Name': lead.clientName.trim(),
        'Mobile': cleanedMobile,
        'Email': lead.email?.trim() || null,
        'Enquiry For': lead.enquiryFor.trim(),
        'Property Type': lead.propertyType.trim(),
        'Assigned To': assignedTo,
        'Created Date': formattedDate,
        'Enquiry Progress': 'New',
        'Budget': lead.budget.trim(),
        'NFD': null, // Will be set manually by sales team
        'Enquiry Source': 'Housing', // Always 'Housing' for these leads
        'Area': lead.area.trim(),
        'Configuration': lead.configuration.trim(),
        'Remarks': lead.remarks.trim(),
        'Last Remarks': lead.remarks.trim(),
        'Assigned By': 'System'
      };

      console.log(`[HousingSupabaseSync] Inserting lead: ${lead.clientName} (${cleanedMobile})`);

      const { data, error } = await supabase
        .from('enquiries')
        .insert(enquiryData)
        .select('id')
        .single();

      if (error) {
        console.error('[HousingSupabaseSync] Error inserting lead:', error);
        return { id: '', success: false, error: error.message };
      }

      console.log(`[HousingSupabaseSync] Successfully inserted lead: ${lead.clientName} (${cleanedMobile}) with ID: ${data.id}`);
      return { id: data.id, success: true };
    } catch (error) {
      console.error('[HousingSupabaseSync] Error in insertLead:', error);
      return { id: '', success: false, error: String(error) };
    }
  }

  async syncLeads(leads: ProcessedLead[]): Promise<{ 
    inserted: number; 
    skipped: number; 
    errors: number;
    details: Array<{ lead: ProcessedLead; status: string; error?: string }> 
  }> {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const details: Array<{ lead: ProcessedLead; status: string; error?: string }> = [];

    for (const lead of leads) {
      const result = await this.insertLead(lead);
      
      if (result.success) {
        inserted++;
        details.push({ lead, status: 'inserted' });
      } else if (result.error === 'Lead already exists') {
        skipped++;
        details.push({ lead, status: 'skipped', error: result.error });
      } else {
        errors++;
        details.push({ lead, status: 'error', error: result.error });
      }
    }

    return { inserted, skipped, errors, details };
  }

  async getLastFetchTimestamp(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'housing_last_fetch')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[HousingSupabaseSync] Error fetching last fetch timestamp:', error);
      }

      if (data?.value) {
        return parseInt(data.value);
      }

      // Default to 24 hours ago if no timestamp found
      const defaultTimestamp = Math.floor(Date.now() / 1000) - (24 * 3600);
      console.log('[HousingSupabaseSync] Using default timestamp (24 hours ago):', defaultTimestamp);
      return defaultTimestamp;
    } catch (error) {
      console.error('[HousingSupabaseSync] Error in getLastFetchTimestamp:', error);
      return Math.floor(Date.now() / 1000) - (24 * 3600);
    }
  }

  async updateLastFetchTimestamp(timestamp: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'housing_last_fetch',
          value: timestamp.toString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.log('[HousingSupabaseSync] system_config table not available, using fallback timestamp storage');
        // Fallback: Store timestamp in localStorage or use alternative method
        console.log('[HousingSupabaseSync] Timestamp updated in memory only:', timestamp);
      } else {
        console.log('[HousingSupabaseSync] Successfully updated last fetch timestamp:', timestamp);
      }
    } catch (error) {
      console.log('[HousingSupabaseSync] Error updating last fetch timestamp (continuing operation):', error);
    }
  }
}
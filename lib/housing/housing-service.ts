import { HousingAPIClient } from './api-client';
import { HousingSupabaseSync } from './supabase-sync';
import { ProcessedLead } from './types';

export class HousingService {
  public apiClient: HousingAPIClient;
  public supabaseSync: HousingSupabaseSync;

  constructor() {
    this.apiClient = new HousingAPIClient();
    this.supabaseSync = new HousingSupabaseSync();
  }

  async fetchAndSyncLatestLeads(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      fetched: number;
      inserted: number;
      skipped: number;
      errors: number;
    };
    details?: any;
  }> {
    try {
      console.log('[HousingService] Starting fetchAndSyncLatestLeads...');
      
      // Get the last fetch timestamp
      console.log('[HousingService] Getting last fetch timestamp...');
      const lastFetchTimestamp = await this.supabaseSync.getLastFetchTimestamp();
      const currentTimestamp = Math.floor(Date.now() / 1000);

      console.log(`[HousingService] Fetching leads from ${new Date(lastFetchTimestamp * 1000).toISOString()} to ${new Date(currentTimestamp * 1000).toISOString()}`);
      console.log(`[HousingService] Start timestamp: ${lastFetchTimestamp}`);
      console.log(`[HousingService] End timestamp: ${currentTimestamp}`);

      // Fetch leads from Housing API
      console.log('[HousingService] Calling Housing API...');
      const rawLeads = await this.apiClient.fetchLeads(
        lastFetchTimestamp.toString(),
        currentTimestamp.toString()
      );

      if (rawLeads.length === 0) {
        console.log('No new leads found');
        await this.supabaseSync.updateLastFetchTimestamp(currentTimestamp);
        return {
          success: true,
          message: 'No new leads found',
          stats: {
            fetched: 0,
            inserted: 0,
            skipped: 0,
            errors: 0
          }
        };
      }

      console.log(`Found ${rawLeads.length} new leads from Housing API`);

      // Process the leads
      const processedLeads: ProcessedLead[] = rawLeads.map(lead =>
        this.apiClient.processLead(lead)
      );

      console.log(`[HousingService] Processing ${rawLeads.length} leads for database sync`);

      // Sync the processed leads to Supabase
      const syncResult = await this.supabaseSync.syncLeads(processedLeads);

      // Update the last fetch timestamp to avoid fetching same leads
      await this.supabaseSync.updateLastFetchTimestamp(currentTimestamp);

      return {
        success: true,
        message: `Successfully synced ${rawLeads.length} leads from Housing API to database`,
        stats: {
          fetched: rawLeads.length,
          inserted: syncResult.inserted,
          skipped: syncResult.skipped,
          errors: syncResult.errors
        },
        details: syncResult.details.map(detail => ({
          lead: detail.lead,
          status: detail.status,
          error: detail.error
        }))
      };
    } catch (error) {
      console.error('Error in fetchAndSyncLatestLeads:', error);
      return {
        success: false,
        message: `Error syncing leads: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Test with a small time window (last 1 hour)
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - 3600; // 1 hour ago

      const leads = await this.apiClient.fetchLeads(
        startTime.toString(),
        endTime.toString()
      );

      return {
        success: true,
        message: `Connection successful! Found ${leads.length} leads in the last hour`,
        data: leads
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async testFetchWithTimeRange(startTime: number, endTime: number): Promise<{
    success: boolean;
    message: string;
    data?: ProcessedLead[];
    count?: number;
  }> {
    try {
      const rawLeads = await this.apiClient.fetchLeads(
        startTime.toString(),
        endTime.toString()
      );
      const processedLeads = rawLeads.map(lead => this.apiClient.processLead(lead));
      return {
        success: true,
        message: `Successfully fetched ${processedLeads.length} leads for time range`,
        data: processedLeads,
        count: processedLeads.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in testFetchWithTimeRange: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async manualFetch(hoursBack: number = 24): Promise<{
    success: boolean;
    message: string;
    stats?: {
      fetched: number;
      inserted: number;
      skipped: number;
      errors: number;
    };
  }> {
    try {
      const processedLeads = await this.apiClient.fetchLatestLeads(hoursBack);

      if (processedLeads.length === 0) {
        return {
          success: true,
          message: `No leads found in the last ${hoursBack} hours`,
          stats: {
            fetched: 0,
            inserted: 0,
            skipped: 0,
            errors: 0
          }
        };
      }

      const syncResult = await this.supabaseSync.syncLeads(processedLeads);

      return {
        success: true,
        message: `Successfully synced leads from last ${hoursBack} hours`,
        stats: {
          fetched: processedLeads.length,
          inserted: syncResult.inserted,
          skipped: syncResult.skipped,
          errors: syncResult.errors
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error fetching leads: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async filterExistingLeads(leads: ProcessedLead[]): Promise<ProcessedLead[]> {
    try {
      return await this.supabaseSync.filterExistingLeads(leads);
    } catch (error) {
      console.error('[HousingService] Error filtering existing leads:', error);
      return leads;
    }
  }

  async addLeadsToSupabase(leads: ProcessedLead[]): Promise<{
    inserted: number;
    skipped: number;
    errors: number;
    details: Array<{ lead: ProcessedLead; status: string; error?: string }>;
  }> {
    try {
      console.log(`[HousingService] Adding ${leads.length} leads to Supabase...`);

      const syncResult = await this.supabaseSync.syncLeads(leads);

      console.log(`[HousingService] Sync result:`, syncResult);

      return syncResult;
    } catch (error) {
      console.error('[HousingService] Error adding leads to Supabase:', error);
      return {
        inserted: 0,
        skipped: 0,
        errors: leads.length,
        details: leads.map(lead => ({
          lead,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        }))
      };
    }
  }
}
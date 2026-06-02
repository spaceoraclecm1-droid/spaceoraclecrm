'use client';

import { useState, useEffect } from 'react';

interface HousingLead {
  clientName: string;
  mobile: string;
  email: string;
  configuration: string;
  enquiryFor: string;
  propertyType: string;
  budget: string;
  area: string;
  remarks: string;
  createdDate: string;
}

interface FetchResponse {
  success: boolean;
  message: string;
  data?: HousingLead[];
  count?: number;
  error?: string;
}

interface AddResponse {
  success: boolean;
  message: string;
  data?: {
    inserted: number;
    skipped: number;
    errors: number;
    details: Array<{ lead: HousingLead; status: string; error?: string }>;
  };
  error?: string;
}

export default function HousingLeadsFetcher() {
  const [leads, setLeads] = useState<HousingLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [addStatus, setAddStatus] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());

  // Check connection on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const response = await fetch('/api/housing/test');
      const data: FetchResponse = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
        console.log('[HousingLeadsFetcher] ✅ Connection successful');
      } else {
        setConnectionStatus('error');
        setError(data.message || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Failed to connect to Housing.com API');
      console.error('[HousingLeadsFetcher] Connection error:', err);
    }
  };

  const fetchLatestLeads = async () => {
    setFetching(true);
    setError('');
    setAddStatus('');
    setSelectedLeads(new Set());

    try {
      console.log('[HousingLeadsFetcher] Fetching latest leads...');
      const response = await fetch('/api/housing/fetch-leads');
      const data: FetchResponse = await response.json();

      if (data.success && data.data) {
        setLeads(data.data);
        console.log(`[HousingLeadsFetcher] ✅ Fetched ${data.data.length} leads`);
      } else {
        setError(data.message || 'Failed to fetch leads');
        setLeads([]);
      }
    } catch (err) {
      setError('Failed to fetch leads');
      console.error('[HousingLeadsFetcher] Fetch error:', err);
    } finally {
      setFetching(false);
    }
  };

  const addLeadsToSupabase = async (leadsToAdd: HousingLead[]) => {
    setLoading(true);
    setAddStatus('');

    try {
      console.log(`[HousingLeadsFetcher] Adding ${leadsToAdd.length} leads to Supabase...`);

      const response = await fetch('/api/housing/fetch-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leads: leadsToAdd }),
      });

      const data: AddResponse = await response.json();

      if (data.success && data.data) {
        const { inserted, skipped, errors } = data.data;
        setAddStatus(`✅ Added ${inserted} leads | Skipped ${skipped} duplicates | ${errors} errors`);

        // Remove successfully added or skipped (already existing) leads from the list
        setLeads(prev => prev.filter(lead =>
          !data.data?.details.find(detail =>
            detail.lead.clientName === lead.clientName &&
            detail.lead.mobile === lead.mobile &&
            (detail.status === 'inserted' || detail.status === 'skipped')
          )
        ));

        console.log(`[HousingLeadsFetcher] ✅ Added ${inserted} leads to Supabase`);
      } else {
        setAddStatus(`❌ ${data.message || 'Failed to add leads'}`);
      }
    } catch (err) {
      setAddStatus('❌ Failed to add leads to Supabase');
      console.error('[HousingLeadsFetcher] Add error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = (index: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((_, index) => index)));
    }
  };

  const addSelectedLeads = () => {
    const leadsToAdd = Array.from(selectedLeads).map(index => leads[index]);
    if (leadsToAdd.length > 0) {
      addLeadsToSupabase(leadsToAdd);
    }
  };

  const addAllLeads = () => {
    if (leads.length > 0) {
      addLeadsToSupabase(leads);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (budget: string) => {
    if (budget === 'Not specified') return 'N/A';
    if (budget.includes('₹')) return budget;
    return `₹${budget}`;
  };

  return (
    <div className="relative mb-16">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>

      <div className="relative py-12 px-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              <span className="inline-block w-1.5 h-6 bg-[#c69c6d] rounded-full mr-3"></span>
              Housing.com Leads
            </h2>
            <p className="text-[#e5d0b1] max-w-2xl">
              Fetch and add latest leads from Housing.com to your CRM
            </p>
          </div>
          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Connected
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
                <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                Connection Error
              </span>
            )}
            {connectionStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
                <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                Checking...
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchLatestLeads}
            disabled={fetching || connectionStatus !== 'connected'}
            className="w-full sm:w-auto px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all disabled:bg-white/10 disabled:cursor-not-allowed font-medium"
          >
            {fetching ? '🔄 Fetching...' : '🔄 Fetch Latest Leads'}
          </button>

          {connectionStatus === 'idle' && (
            <button
              onClick={checkConnection}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
            >
              🔌 Check Connection
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {addStatus && (
        <div className={`relative mb-4 px-8 py-4 rounded-xl backdrop-blur-sm ${
          addStatus.includes('✅') ? 'bg-green-500/10 border-green-400/30 text-green-100' :
          addStatus.includes('❌') ? 'bg-red-500/10 border-red-400/30 text-red-100' :
          'bg-blue-500/10 border-blue-400/30 text-blue-100'
        }`}>
          <div className="flex items-center gap-2">
            {addStatus.includes('✅') && <span className="text-2xl">✅</span>}
            {addStatus.includes('❌') && <span className="text-2xl">❌</span>}
            <span className="text-sm font-medium">{addStatus}</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="relative mb-4 px-8 py-4 rounded-xl backdrop-blur-sm bg-red-500/10 border border-red-400/30 text-red-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {connectionStatus === 'error' && (
        <div className="relative mb-4 px-8 py-4 rounded-xl backdrop-blur-sm bg-red-500/10 border border-red-400/30 text-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold">Connection Error</p>
                <p className="text-xs text-red-200 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={checkConnection}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded hover:bg-white/30 transition-all text-sm font-medium"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      
      {/* Leads Display */}
      {leads.length > 0 && (
        <div className="relative px-8 pb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/80 to-[#264a42]/80 rounded-2xl -z-10"></div>
          <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5 mix-blend-overlay rounded-2xl -z-10"></div>

          <div className="relative py-8">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <label className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg cursor-pointer hover:bg-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === leads.length && leads.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-white/30 text-[#c69c6d] focus:ring-[#c69c6d] focus:ring-offset-0"
                />
                <span className="text-sm font-medium">
                  Select All ({selectedLeads.size}/{leads.length})
                </span>
              </label>

              <button
                onClick={addSelectedLeads}
                disabled={loading || selectedLeads.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-[#c69c6d] to-[#b0895b] text-white rounded-lg hover:from-[#b0895b] hover:to-[#9d7a4f] transition-all disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed font-medium shadow-lg"
              >
                {loading ? 'Adding...' : `➕ Add Selected (${selectedLeads.size})`}
              </button>

              <button
                onClick={addAllLeads}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-[#264a42] to-[#1f3934] text-white rounded-lg hover:from-[#1f3934] hover:to-[#1a2e29] transition-all disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed font-medium shadow-lg"
              >
                {loading ? 'Adding...' : `➕ Add All (${leads.length})`}
              </button>
            </div>

            {/* Leads List */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
              <div className="max-h-96 overflow-y-auto">
                {leads.map((lead, index) => (
                  <div key={index} className="border-b border-white/10 p-6 hover:bg-white/5 transition-colors last:border-b-0">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(index)}
                        onChange={() => handleSelectLead(index)}
                        className="mt-1 w-4 h-4 rounded border-white/30 text-[#c69c6d] focus:ring-[#c69c6d] focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-white">{lead.clientName}</h3>
                          <span className="text-xs text-[#e5d0b1]">
                            {formatDate(lead.createdDate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[#e5d0b1]">📞</span>
                            <span className="text-white">{lead.mobile}</span>
                            {lead.email && (
                              <>
                                <span className="text-[#e5d0b1] ml-3">📧</span>
                                <span className="text-white">{lead.email}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#e5d0b1]">🏢</span>
                            <span className="text-white">{lead.enquiryFor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#e5d0b1]">📐</span>
                            <span className="text-white">{lead.configuration || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#e5d0b1]">💰</span>
                            <span className="text-white">{formatBudget(lead.budget)}</span>
                          </div>
                        </div>

                        {lead.remarks && (
                          <div className="mt-3 text-xs text-[#e5d0b1] italic bg-white/5 rounded-lg p-3">
                            📝 {lead.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Leads */}
      {!fetching && connectionStatus === 'connected' && leads.length === 0 && !error && (
        <div className="relative px-8 py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/80 to-[#264a42]/80 rounded-2xl -z-10"></div>
          <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5 mix-blend-overlay rounded-2xl -z-10"></div>

          <div className="relative text-center">
            <div className="text-[#e5d0b1]/60 mb-6">
              <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">No leads found from Housing.com</h3>
            <p className="text-[#e5d0b1]">Click "🔄 Fetch Latest Leads" to check for new leads</p>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import SearchBar from '../components/SearchBar';

interface Inquiry {
  id: string | number;
  clientName: string;
  mobile: string;
  email?: string;
  configuration: string;
  description: string;
  status: string;
  source: string;
  assignedEmployee: string;
  dateCreated: string;
  budget?: string;
  area?: string;
  lastRemarks?: string;
  nfd?: string;
}

// Supabase response types
interface EnquiryRecord {
  id: string | number;
  "Client Name"?: string;
  Mobile?: string;
  Email?: string;
  "Enquiry For"?: string;
  "Property Type"?: string;
  "Assigned To"?: string;
  "Created Date"?: string;
  "Enquiry Progress"?: string;
  Budget?: string;
  NFD?: string;
  "Enquiry Source"?: string;
  Area?: string;
  Configuration?: string;
  "Last Remarks"?: string;
  Remarks?: string;
  [key: string]: string | number | undefined;  // Replace any with more specific types
}

// Add a utility function to convert mobile number to WhatsApp Web URL
const getWhatsAppUrl = (mobile: string): string => {
  // Clean up the phone number - remove spaces, dashes, parentheses, etc.
  const cleanedNumber = mobile.replace(/[\s\-\(\)]/g, '');
  
  // Make sure it starts with a country code, default to India (+91) if no code
  const numberWithCountryCode = cleanedNumber.startsWith('+') 
    ? cleanedNumber 
    : cleanedNumber.startsWith('91') 
      ? `+${cleanedNumber}` 
      : `+91${cleanedNumber}`;
      
  return `https://wa.me/${numberWithCountryCode.replace('+', '')}`;
};

// Add a utility function to format phone number for calls
const getPhoneCallUrl = (mobile: string): string => {
  // Clean up the phone number - remove spaces, dashes, parentheses, etc.
  const cleanedNumber = mobile.replace(/[\s\-\(\)]/g, '');
  
  // Make sure it starts with a country code, default to India (+91) if no code
  const numberWithCountryCode = cleanedNumber.startsWith('+') 
    ? cleanedNumber 
    : cleanedNumber.startsWith('91') 
      ? `+${cleanedNumber}` 
      : `+91${cleanedNumber}`;
      
  return `tel:${numberWithCountryCode}`;
};

const formatDisplayDate = (value?: string): string => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB');
  }

  return value;
};

// Fetch unique inquiry IDs that have a 'deal_done' progress entry
const fetchDealDoneInquiryIds = async (): Promise<(string | number)[]> => {
  try {
    const { data, error } = await supabase
      .from('Inquiry_Progress')
      .select('eid')
      .eq('progress_type', 'deal_done');

    if (error) throw error;

    const ids = (data || []).map((row: any) => row.eid);
    return Array.from(new Set(ids));
  } catch (err) {
    console.error("Error fetching deal_done inquiry IDs:", err);
    return [];
  }
};

export default function NewInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFetchingHousing, setIsFetchingHousing] = useState(false);
  const [filterEmployee, setFilterEmployee] = useState<string>('ALL');

  useEffect(() => {
    fetchNewInquiries();
  }, []);

  // Effect to filter inquiries based on search query and employee filter
  useEffect(() => {
    let filtered = inquiries;

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(inquiry =>
        inquiry.clientName.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.mobile.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.configuration.toLowerCase().includes(lowerCaseQuery) ||
        (inquiry.email && inquiry.email.toLowerCase().includes(lowerCaseQuery)) ||
        inquiry.source.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.assignedEmployee.toLowerCase().includes(lowerCaseQuery) ||
        (inquiry.description && inquiry.description.toLowerCase().includes(lowerCaseQuery))
      );
    }

    // Filter by employee
    if (filterEmployee !== 'ALL') {
      filtered = filtered.filter(inquiry =>
        inquiry.assignedEmployee === filterEmployee
      );
    }

    setFilteredInquiries(filtered);
  }, [searchQuery, inquiries, filterEmployee]);

  const fetchNewInquiries = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching new inquiries...');
      
      // Also get all 'deal_done' inquiry IDs to explicitly exclude
      const dealDoneIds = await fetchDealDoneInquiryIds();
      
      // Query to get new inquiries
      let query = supabase
        .from('enquiries')
        .select('*')
        .eq('Enquiry Progress', 'New');

      // Explicitly exclude deal_done inquiries as well (redundant safety)
      if (dealDoneIds.length > 0) {
        query = query.not('id', 'in', `(${dealDoneIds.join(',')})`);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching from enquiries table:', error);
        throw error;
      }

      console.log('New inquiries fetched:', data?.length || 0);
      
      // Ensure data is treated as EnquiryRecord[]
      const typedData = data as EnquiryRecord[];

      const inquiryIds = typedData.map(enquiry => enquiry.id);
      const progressDateByInquiry = new Map<string | number, string>();

      if (inquiryIds.length > 0) {
        const { data: progressRows, error: progressError } = await supabase
          .from('Inquiry_Progress')
          .select('eid, date, created_at')
          .in('eid', inquiryIds)
          .order('created_at', { ascending: false });

        if (progressError) {
          console.error('Error fetching progress dates for new inquiries:', progressError);
        } else {
          (progressRows || []).forEach((row: any) => {
            if (!progressDateByInquiry.has(row.eid) && row.date) {
              progressDateByInquiry.set(row.eid, row.date);
            }
          });
        }
      }
      
      // Transform the data to match our Inquiry type
      const transformedData: Inquiry[] = typedData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        email: enquiry.Email || '',
        configuration: enquiry.Configuration || '',
        description: enquiry.Remarks || enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"] || 'New',
        source: enquiry["Enquiry Source"] || 'Unknown',
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: String(enquiry["Created Date"] || enquiry.created_at || new Date().toISOString()),
        budget: enquiry.Budget || '',
        area: enquiry.Area || '',
        lastRemarks: enquiry["Last Remarks"] || '',
        nfd: enquiry.NFD || progressDateByInquiry.get(enquiry.id) || ''
      }));
      
      console.log('Final list of new inquiries:', transformedData.length);
      setInquiries(transformedData);
      setFilteredInquiries(transformedData);
    } catch (error) {
      console.error('Error fetching new inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const fetchHousingLeads = async () => {
    console.log('🚀 Starting Housing.com lead fetch process...');
    console.log('==========================================');
    
    setIsFetchingHousing(true);
    
    try {
      // First check debug endpoint
      console.log('🔍 Step 0: Checking configuration...');
      const debugResponse = await fetch('/api/housing/debug');
      const debugData = await debugResponse.json();
      console.log('   Configuration status:', debugData);
      
      if (!debugData.configStatus.valid) {
        throw new Error('Housing API configuration is not valid. Check environment variables.');
      }
      
      console.log('📡 Step 1: Calling Housing API sync endpoint...');
      console.log('   Endpoint: /api/housing/sync');
      console.log('   Method: GET');
      console.log('   Time:', new Date().toISOString());
      
      const response = await fetch('/api/housing/sync');
      
      console.log('📥 Step 2: Received response from API');
      console.log('   Status:', response.status);
      console.log('   Status Text:', response.statusText);
      console.log('   Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      
      console.log('📊 Step 3: Parsed response data');
      console.log('   Success:', data.success);
      console.log('   Message:', data.message);
      
      if (data.stats) {
        console.log('📈 Step 4: Sync Statistics');
        console.log('   Total Fetched from Housing API:', data.stats.fetched);
        console.log('   New Leads Inserted:', data.stats.inserted);
        console.log('   Duplicate Leads Skipped:', data.stats.skipped);
        console.log('   Errors Encountered:', data.stats.errors);
      }
      
      if (data.details && Array.isArray(data.details)) {
        console.log('📋 Step 5: Lead Processing Details');
        data.details.forEach((detail: any, index: number) => {
          console.log(`   Lead ${index + 1}:`);
          console.log(`     - Name: ${detail.lead?.clientName || 'N/A'}`);
          console.log(`     - Mobile: ${detail.lead?.mobile || 'N/A'}`);
          console.log(`     - Status: ${detail.status}`);
          if (detail.error) {
            console.log(`     - Error: ${detail.error}`);
          }
        });
      }
      
      if (data.success) {
        console.log('✅ Step 6: Sync completed successfully!');
        
        // Show success alert with testing note
        if (data.stats) {
          let alertMessage = `Housing API Test Results:\n\n` +
            `📥 Fetched: ${data.stats.fetched} leads from Housing.com\n`;
          
          if (data.message.includes('TEST MODE')) {
            alertMessage += `\n⚠️ TEST MODE: Leads fetched but NOT saved to database\n`;
            
            // Show first few leads for verification
            if (data.details && data.details.length > 0) {
              alertMessage += `\n📋 Sample Leads:\n`;
              data.details.slice(0, 3).forEach((detail: any, index: number) => {
                alertMessage += `${index + 1}. ${detail.lead?.clientName || 'N/A'} - ${detail.lead?.mobile || 'N/A'}\n`;
              });
              if (data.details.length > 3) {
                alertMessage += `   ... and ${data.details.length - 3} more\n`;
              }
            }
          } else {
            alertMessage += `✅ Inserted: ${data.stats.inserted} new leads\n` +
              `⏭️ Skipped: ${data.stats.skipped} duplicates\n` +
              `❌ Errors: ${data.stats.errors}`;
          }
          
          alert(alertMessage);
        } else {
          alert('Housing leads fetch completed successfully!');
        }
        
        console.log('🔄 Step 7: Test complete - No database refresh needed in test mode');
        // Don't refresh in test mode since nothing was inserted
        if (!data.message.includes('TEST MODE')) {
          await fetchNewInquiries();
          console.log('✨ Step 8: Inquiry list refreshed successfully!');
        }
        
      } else {
        console.error('❌ Step 6: Sync failed');
        console.error('   Error Message:', data.message);
        if (data.error) {
          console.error('   Error Details:', data.error);
        }
        alert(`Failed to fetch Housing leads:\n${data.message}`);
      }
      
    } catch (error) {
      console.error('💥 Critical Error in Housing lead fetch:');
      console.error('   Error Type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('   Error Message:', error instanceof Error ? error.message : String(error));
      console.error('   Stack Trace:', error instanceof Error ? error.stack : 'N/A');
      
      alert('Error fetching Housing leads. Check console for details.');
    } finally {
      console.log('🏁 Housing lead fetch process completed');
      console.log('==========================================');
      setIsFetchingHousing(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-12 px-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">New Inquiries</h1>
              <div className="text-[#e5d0b1] text-lg font-semibold">
                {inquiries.length} Inquiries
              </div>
              <p className="text-[#e5d0b1] max-w-2xl mt-2">
                All recently added inquiries with &apos;New&apos; status
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchHousingLeads}
                disabled={isFetchingHousing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all self-start font-medium ${
                  isFetchingHousing 
                    ? 'bg-gray-400/20 text-gray-300 cursor-not-allowed' 
                    : 'bg-[#c69c6d]/20 backdrop-blur-sm text-[#f5e6d3] hover:bg-[#c69c6d]/30 border border-[#c69c6d]/30'
                }`}
              >
                {isFetchingHousing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching Leads...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span>Get Latest Leads</span>
                  </>
                )}
              </button>
              <Link 
                href="/" 
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all self-start"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search by client name, phone number, or configuration..."
              defaultValue={searchQuery}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-6">
            {/* Employee Filter */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <label className="block text-sm text-[#e5d0b1] mb-1">Filter by Employee</label>
              <select
                className="w-full appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterEmployee}
                onChange={(e) => {
                  console.log('Selected employee:', e.target.value);
                  setFilterEmployee(e.target.value);
                }}
              >
                <option value="ALL">All Employees</option>
                <option value="Rushirajsinh, Zala">Rushirajsinh, Zala</option>
                <option value="Maulik, Jadav">Maulik, Jadav</option>
                <option value="Rajdeepsinh, Jadeja">Rajdeepsinh, Jadeja</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none">
                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Filter Stats */}
            {filterEmployee !== 'ALL' && (
              <div className="flex items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    setFilterEmployee('ALL');
                  }}
                  className="w-full sm:w-auto text-[#e5d0b1] hover:text-white flex items-center justify-center sm:justify-start gap-1 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              New Inquiry List
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredInquiries.length} of {inquiries.length} inquiries
              </span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c69c6d]"></div>
            </div>
          ) : (
            <table className="premium-table premium-table-wrap w-full">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Configuration</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Progress</th>
                  <th>Next Follow-up</th>
                  <th>Last Remarks</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.length > 0 ? (
                  filteredInquiries.map(inquiry => (
                    <tr key={inquiry.id}>
                      <td>
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Link
                              href={`/enquiry/${inquiry.id}/edit`}
                              className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                              title="Edit Inquiry"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Link>
                            <Link
                              href={`/enquiry/${inquiry.id}/progress`}
                              className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                              title="Add Progress"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                              </svg>
                            </Link>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium break-words text-gray-900 dark:text-white">{inquiry.clientName}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="break-words">{inquiry.mobile}</span>
                              <a
                                href={getWhatsAppUrl(inquiry.mobile)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                title="Open in WhatsApp"
                                onClick={(e) => e.stopPropagation()}
                              >
                                WhatsApp
                              </a>
                              <a
                                href={getPhoneCallUrl(inquiry.mobile)}
                                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Call this number"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Call
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{inquiry.configuration || 'N/A'}</div>
                      </td>
                      <td>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                          {inquiry.source}
                        </div>
                      </td>
                      <td>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                          {inquiry.assignedEmployee}
                        </div>
                      </td>
                      <td>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                          {inquiry.status}
                        </div>
                      </td>
                      <td>
                        {inquiry.nfd || '-'}
                      </td>
                      <td>
                        <div className="max-w-[240px]">
                          <div className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-normal leading-snug">
                            {inquiry.lastRemarks || 'No remarks yet'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDisplayDate(inquiry.dateCreated)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No new inquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">There are no inquiries with &apos;New&apos; status</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 
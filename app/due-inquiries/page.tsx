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
  [key: string]: string | number | undefined;
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
      .eq('progress_type', 'deal_done')
      .limit(100000);

    if (error) throw error;

    const ids = (data || []).map((row: any) => row.eid);
    return Array.from(new Set(ids));
  } catch (err) {
    console.error("Error fetching deal_done inquiry IDs:", err);
    return [];
  }
};

export default function DueInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');

  useEffect(() => {
    fetchDueInquiries();
  }, []);

  // Effect to filter inquiries based on search query and assigned to filter
  useEffect(() => {
    let filtered = inquiries;

    // Apply search query filter
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(inquiry => 
        inquiry.clientName.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.mobile.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.configuration.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.source.toLowerCase().includes(lowerCaseQuery) ||
        inquiry.assignedEmployee.toLowerCase().includes(lowerCaseQuery) ||
        (inquiry.description && inquiry.description.toLowerCase().includes(lowerCaseQuery)) ||
        (inquiry.lastRemarks && inquiry.lastRemarks.toLowerCase().includes(lowerCaseQuery)) ||
        (inquiry.nfd && inquiry.nfd.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    // Apply assigned to filter
    if (assignedToFilter) {
      filtered = filtered.filter(inquiry => 
        inquiry.assignedEmployee.toLowerCase() === assignedToFilter.toLowerCase()
      );
    }
    
    setFilteredInquiries(filtered);
  }, [searchQuery, assignedToFilter, inquiries]);

  const fetchDueInquiries = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching due inquiries using simplified logic...');
      
      // Get current date
      const today = new Date();
      const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      // Parse today's date for comparison
      const [todayDay, todayMonth, todayYear] = todayFormatted.split('/').map(Number);
      
      // Create Date object for today (with time set to midnight)
      const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
      
      // Get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost')
        .limit(100000);

      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }

      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = new Set(dealLostData.map(item => item.eid));
      console.log('Inquiries with deal_lost progress to exclude from due inquiries:', dealLostInquiryIds.size);

      // Get inquiry IDs that have deal_done progress type (exclude from Due page)
      const dealDoneIds = await fetchDealDoneInquiryIds();
      const dealDoneIdSet = new Set(dealDoneIds);
      console.log('Inquiries with deal_done progress to exclude from due inquiries:', dealDoneIdSet.size);

      // Fetch all enquiries (also exclude Deal Lost / Deal Done by status as a safety net)
      let enquiriesQuery = supabase
        .from('enquiries')
        .select('*')
        .neq('Enquiry Progress', 'Deal Lost')
        .neq('Enquiry Progress', 'Deal Done');

      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.size > 0) {
        const dealLostArray = Array.from(dealLostInquiryIds);
        enquiriesQuery = enquiriesQuery.not('id', 'in', `(${dealLostArray.join(',')})`);
      }

      // Exclude inquiries with deal_done progress as well
      if (dealDoneIdSet.size > 0) {
        const dealDoneArray = Array.from(dealDoneIdSet);
        enquiriesQuery = enquiriesQuery.not('id', 'in', `(${dealDoneArray.join(',')})`);
      }
      
      const { data, error } = await enquiriesQuery;

      if (error) throw error;
      
      // Filter inquiries: NFD earlier than today AND not lost/done/cancelled
      const filteredData = data.filter(enquiry => {
        // Drop deal lost / deal done / cancelled by status text as a final safety net
        const status = (enquiry["Enquiry Progress"] || '').toLowerCase();
        if (status.includes('done') || status.includes('lost') || status.includes('cancelled')) {
          return false;
        }

        // Skip if no NFD
        if (!enquiry.NFD) return false;

        // Parse the NFD date
        const [day, month, year] = enquiry.NFD.split('/').map(Number);

        // Check if this is a valid date
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

        // Create Date object for NFD (with time set to midnight)
        const nfdDate = new Date(year, month - 1, day);

        // NFD is earlier than today
        return nfdDate < todayDate;
      });
      
      console.log('Due inquiries (NFD earlier than today):', filteredData.length);
      
      // Ensure data is treated as EnquiryRecord[]
      const typedData = filteredData as EnquiryRecord[];
      
      // Transform the data to match our Inquiry type
      const transformedData: Inquiry[] = typedData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        email: enquiry.Email || '',
        configuration: enquiry.Configuration || '',
        description: enquiry.Remarks || enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"] || 'Due',
        source: enquiry["Enquiry Source"] || 'Unknown',
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: String(enquiry["Created Date"] || enquiry.created_at || new Date().toISOString()),
        budget: enquiry.Budget || '',
        area: enquiry.Area || '',
        lastRemarks: enquiry["Last Remarks"] || '',
        nfd: enquiry.NFD || ''
      }));
      
      console.log('Transformed due inquiries:', transformedData.length);
      setInquiries(transformedData);
      setFilteredInquiries(transformedData);
    } catch (error) {
      console.error('Error fetching due inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAssignedToFilter = (assignedTo: string) => {
    setAssignedToFilter(assignedTo === assignedToFilter ? '' : assignedTo);
  };

  const getSourceBadge = (source: string) => {
    let colorClass = 'bg-blue-100 text-blue-800';
    
    if (source.includes('FACEBOOK') || source.includes('Facebook')) {
      colorClass = 'bg-indigo-100 text-indigo-800';
    } else if (source.includes('REF') || source.includes('Reference')) {
      colorClass = 'bg-green-100 text-green-800';
    } else if (source.includes('PORTAL')) {
      colorClass = 'bg-purple-100 text-purple-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {source}
      </span>
    );
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
              <h1 className="text-3xl font-bold mb-2">Due Inquiries</h1>
              <div className="text-[#e5d0b1] text-lg font-semibold">
                {inquiries.length} Inquiries
              </div>
              <p className="text-[#e5d0b1] max-w-2xl mt-2">
                All inquiries with follow-up dates before yesterday
              </p>
            </div>
            <Link 
              href="/" 
              className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all self-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search by client name, phone number, or follow-up date..." 
              defaultValue={searchQuery}
            />
          </div>
          
          {/* Assigned To Filter */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Filter by Assigned To:</div>
            <div className="flex flex-wrap gap-2">
              {["Maulik, Jadav", "Rushirajsinh, Zala", "Rajdeepsinh, Jadeja"].map((name) => (
                <button
                  key={name}
                  onClick={() => handleAssignedToFilter(name)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    assignedToFilter === name 
                      ? 'bg-[#c69c6d] text-white' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {name}
                </button>
              ))}
              {assignedToFilter && (
                <button
                  onClick={() => setAssignedToFilter('')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-white hover:bg-red-500/30 transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Inquiry Data Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              Inquiry List
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredInquiries.length} of {inquiries.length} due inquiries
                {assignedToFilter && <span> (Filtered by: {assignedToFilter})</span>}
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
                {filteredInquiries.map(inquiry => (
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
                      <div className="font-medium">{inquiry.configuration === 'Unknown' ? 'N/A' : inquiry.configuration || 'N/A'}</div>
                    </td>
                    <td>
                      {getSourceBadge(inquiry.source)}
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
                ))}
                
                {filteredInquiries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No due inquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">All follow-ups are up to date!</p>
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
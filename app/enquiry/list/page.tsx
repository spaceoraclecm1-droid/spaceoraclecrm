'use client';

import { useEffect, useState, Suspense } from 'react';
import SearchBar from '../../components/SearchBar';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';
import { useSearchParams } from 'next/navigation';
import React from 'react';
import HousingLeadsFetcher from '../../components/HousingLeadsFetcher';

interface Enquiry {
  id: number;
  "Client Name": string;
  "Mobile": string;
  "Email": string;
  "Enquiry For": string;
  "Property Type": string;
  "Assigned To": string;
  "Created Date": string;
  "Enquiry Progress": string;
  "Budget": string;
  "NFD": string;
  "Remarks": string;
  "Favourite": string;
  "Near to Win": string;
  "Enquiry Source": string;
  "Assigned By": string;
  "Area": string;
  "Configuration": string;
  "Last Remarks": string;
}

// Separate component that uses searchParams
function SearchParamsHandler({ onSearchChange, onCategoryChange }: { 
  onSearchChange: (query: string) => void, 
  onCategoryChange: (category: string) => void 
}) {
  const searchParams = useSearchParams();
  // Create a ref to track if the parameters have been applied
  const paramsAppliedRef = React.useRef(false);
  
  useEffect(() => {
    // If we've already applied parameters, don't override user input
    if (paramsAppliedRef.current) return;
    
    // Check for search parameter
    const searchQuery = searchParams.get('search');
    const category = searchParams.get('category');
    
    console.log('URL params detected - search:', searchQuery, 'category:', category);
    
    let hasParams = false;
    
    // Update search state if search parameter exists
    if (searchQuery) {
      console.log('Setting search query from URL param:', searchQuery);
      // Ensure this value is passed to the parent component
      onSearchChange(searchQuery);
      hasParams = true;
    }
    
    // Update category state if category parameter exists
    if (category) {
      console.log('Setting category from URL param:', category);
      onCategoryChange(category);
      hasParams = true;
    }
    
    // Mark parameters as applied if any were found
    if (hasParams) {
      paramsAppliedRef.current = true;
    }
  }, [searchParams, onSearchChange, onCategoryChange]);
  
  return null; // This component doesn't render anything
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

export default function EnquiryList() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterEmployee, setFilterEmployee] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('');

  // Function to fetch enquiries
  const fetchEnquiries = async (query: string, source: string, employee: string, category?: string) => {
    try {
      setIsLoading(true);
      
      // Get yesterday's date in DD/MM/YYYY format
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      console.log('Fetching enquiries with query:', query, 'source:', source, 'employee:', employee, 'category:', category);

      // First, get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost')
        .limit(100000);

      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }

      // Extract the eids (inquiry ids) that have deal_lost progress entries (deduped)
      const dealLostInquiryIds = Array.from(new Set(dealLostData.map(item => item.eid)));
      console.log('Inquiries with deal_lost progress entries to exclude:', dealLostInquiryIds.length);

      // Start building the query (also exclude any row whose status is already Deal Lost)
      let supabaseQuery = supabase
        .from('enquiries')
        .select('*')
        .neq('Enquiry Progress', 'Deal Lost');

      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.length > 0) {
        supabaseQuery = supabaseQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }

      // Date regex pattern for DD/MM/YYYY format
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      
      // Apply search query if provided (and is not empty)
      // Handle empty strings correctly - don't apply filter for empty query
      if (query && query.trim() !== '') {
        if (dateRegex.test(query)) {
          // If query is a date in DD/MM/YYYY format
          supabaseQuery = supabaseQuery.eq('NFD', query);
        } else {
          // Otherwise search in client name, mobile, or last remarks
          supabaseQuery = supabaseQuery.or(
            `"Client Name".ilike.%${query}%,"Mobile".ilike.%${query}%,"Last Remarks".ilike.%${query}%`
          );
        }
      }
      
      // Apply category filter for 'due' - dates earlier than today
      if (category === 'due') {
        console.log('Applying simplified due filtering based on NFD');
        
        // We'll fetch all and filter client-side for dates before today
        // (Since Supabase doesn't support date comparisons directly with DD/MM/YYYY format)
      }

      // Apply source filter
      if (source !== 'ALL') {
        // Match exact source value from dropdown to database column
        console.log('Filtering by source:', source);
        supabaseQuery = supabaseQuery.eq('Enquiry Source', source);
      }

      // Apply employee filter
      if (employee !== 'ALL') {
        console.log('Filtering by employee:', employee);
        supabaseQuery = supabaseQuery.eq('Assigned To', employee);
      }

      // Order by created date
      supabaseQuery = supabaseQuery.order('Created Date', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Supabase query error:', error); // Debug log
        throw error;
      }

      if (data) {
        console.log('Fetched data count (after excluding deal_lost inquiries):', data.length);
        
        // Check if we're filtering by today's date, and show some NFD values
        if (dateRegex.test(query)) {
          console.log('NFD values in results:', data.map(item => item.NFD));
        }
        
        // For "New" inquiries, get the latest remarks from Inquiry_Progress table
        const newInquiries = data.filter(enquiry => enquiry["Enquiry Progress"] === "New");
        console.log('Number of New inquiries to check for progress remarks:', newInquiries.length);
        
        if (newInquiries.length > 0) {
          // Get all inquiry IDs that are "New"
          const newInquiryIds = newInquiries.map(enquiry => enquiry.id);
          
          // Fetch progress entries for these "New" inquiries
          const { data: progressData, error: progressError } = await supabase
            .from('Inquiry_Progress')
            .select('*')
            .in('eid', newInquiryIds)
            .order('created_at', { ascending: false });
            
          if (progressError) {
            console.error('Error fetching progress entries for new inquiries:', progressError);
          } else if (progressData && progressData.length > 0) {
            console.log('Found progress entries for new inquiries:', progressData.length);
            
            // Create a map to store the latest progress entry for each inquiry
            const latestProgressByInquiry = new Map();
            
            // Group by eid and keep only the most recent entry (which should be first due to our sorting)
            progressData.forEach(progress => {
              if (!latestProgressByInquiry.has(progress.eid)) {
                latestProgressByInquiry.set(progress.eid, progress);
              }
            });
            
            console.log('Number of new inquiries with progress entries:', latestProgressByInquiry.size);
            
            // Update the "Last Remarks" field with the latest remark from progress entries
            data.forEach(enquiry => {
              if (enquiry["Enquiry Progress"] === "New" && latestProgressByInquiry.has(enquiry.id)) {
                const latestProgress = latestProgressByInquiry.get(enquiry.id);
                if (latestProgress.remark) {
                  console.log(`Updating Last Remarks for inquiry ${enquiry.id} with progress remark`);
                  enquiry["Last Remarks"] = latestProgress.remark;
                }
              }
            });
          }
        }
        
        // Additional client-side filtering for 'due' category
        let filteredData = data;
        
        if (category === 'due') {
          console.log('Applying simplified due filtering based on NFD');
          
          // Get current date
          const now = new Date();
          const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
          
          // Parse today's date for comparison
          const [todayDay, todayMonth, todayYear] = todayFormatted.split('/').map(Number);
          
          // Create Date object for today (with time set to midnight)
          const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
          
          // Filter inquiries with NFD earlier than today
          filteredData = data.filter(enquiry => {
            // Skip if no NFD
            if (!enquiry.NFD) return false;
            
            // Parse the NFD date (DD/MM/YYYY)
            const [day, month, year] = enquiry.NFD.split('/').map(Number);
            
            // Check if this is a valid date
            if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
            
            // Create Date object for NFD (with time set to midnight)
            const nfdDate = new Date(year, month - 1, day);
            
            // The only condition: NFD is earlier than today
            return nfdDate < todayDate;
          });
          
          console.log('Due inquiries after simplified filtering:', filteredData.length);
        }
        
        setEnquiries(data);
        setFilteredEnquiries(filteredData);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEnquiries(searchQuery, filterSource, filterEmployee, currentCategory);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, filterSource, filterEmployee, currentCategory]);

  // Function to handle search input changes
  const handleSearch = (query: string) => {
    console.log('Search query updated:', query);
    // Don't trim here - accept empty strings too
    setSearchQuery(query);
    
    // Only clear category when there's an actual search query
    if (query) {
      setCurrentCategory(''); // Clear category when searching explicitly
    }
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
    setSearchQuery(''); // Clear search query when filtering by category
  };

  return (
    <div className="fade-in">
      {/* SearchParams Handling (wrapped in Suspense) */}
      <Suspense fallback={null}>
        <SearchParamsHandler 
          onSearchChange={handleSearch} 
          onCategoryChange={handleCategoryChange} 
        />
      </Suspense>
      
      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-12 px-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              {currentCategory === 'due' ? (
                <>
                  <h1 className="text-3xl font-bold mb-2">Due Inquiries</h1>
                  <p className="text-[#e5d0b1] max-w-2xl">
                    All inquiries with follow-up dates before yesterday
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">All Enquiries</h1>
                  <p className="text-[#e5d0b1] max-w-2xl">
                    Track, manage, and optimize your client enquiries
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search by client name, phone number, or date (DD/MM/YYYY)..." 
              defaultValue={searchQuery}
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-6">
            {/* Source Filter */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <label className="block text-sm text-[#e5d0b1] mb-1">Filter by Source</label>
              <select 
                className="w-full appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterSource}
                onChange={(e) => {
                  console.log('Selected source:', e.target.value); // Debug log
                  setFilterSource(e.target.value);
                }}
              >
                <option value="ALL">All Sources</option>
                <option value="Facebook">Facebook</option>
                <option value="Reference">Reference</option>
                <option value="Housing">Housing</option>
              </select>
              <div className="absolute right-3 top-[34px] pointer-events-none">
                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Employee Filter */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <label className="block text-sm text-[#e5d0b1] mb-1">Filter by Employee</label>
              <select 
                className="w-full appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-8 rounded-lg focus:ring-2 focus:ring-[#c69c6d] focus:outline-none"
                value={filterEmployee}
                onChange={(e) => {
                  console.log('Selected employee:', e.target.value); // Debug log
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
            {(filterSource !== 'ALL' || filterEmployee !== 'ALL') && (
              <div className="flex items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => {
                    setFilterSource('ALL');
                    setFilterEmployee('ALL');
                  }}
                  className="w-full sm:w-auto text-[#e5d0b1] hover:text-white flex items-center justify-center sm:justify-start gap-1 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Housing.com Leads Fetcher */}
      <HousingLeadsFetcher />

      {/* Enquiry Data Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Enquiry List
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Note: Inquiries with "Deal Lost" progress are not displayed in this list
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredEnquiries.length} of {enquiries.length} enquiries
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
                {filteredEnquiries.map(enquiry => (
                  <tr key={enquiry.id}>
                    <td data-label="Client">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            href={`/enquiry/${enquiry.id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                            title="Edit Inquiry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <Link
                            href={`/enquiry/${enquiry.id}/progress`}
                            className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                            title="Add Progress"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium break-words text-gray-900 dark:text-white">{enquiry["Client Name"]}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="break-words">{enquiry["Mobile"]}</span>
                            <a
                              href={getWhatsAppUrl(enquiry["Mobile"])}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              title="Open in WhatsApp"
                              onClick={(e) => e.stopPropagation()}
                            >
                              WhatsApp
                            </a>
                            <a
                              href={getPhoneCallUrl(enquiry["Mobile"])}
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
                    <td data-label="Configuration">
                      <div className="font-medium">{enquiry["Configuration"] === 'Unknown' ? 'N/A' : enquiry["Configuration"] || 'N/A'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{enquiry["Property Type"] === 'Unknown' ? 'N/A' : enquiry["Property Type"] || 'N/A'}</div>
                    </td>
                    <td data-label="Source">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry["Enquiry Source"]}
                      </div>
                    </td>
                    <td data-label="Assigned To">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry["Assigned To"]}
                      </div>
                    </td>
                    <td data-label="Progress">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                        {enquiry["Enquiry Progress"]}
                      </div>
                    </td>
                    <td data-label="Next Follow-up">
                      {enquiry["NFD"] || '-'}
                    </td>
                    <td data-label="Last Remarks">
                      <div className="max-w-[240px]">
                        <div className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-normal leading-snug">
                          {enquiry["Last Remarks"] || 'No remarks yet'}
                        </div>
                      </div>
                    </td>
                    <td data-label="Created Date">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDisplayDate(enquiry["Created Date"])}
                      </span>
                    </td>
                  </tr>
                ))}
                
                {filteredEnquiries.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-16 no-label">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No enquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or search criteria</p>
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
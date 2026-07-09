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
  progressDate?: string;
  progressRemark?: string;
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

interface ProgressRecord {
  id: string | number;
  eid: string | number;
  progress_type: string;
  remark?: string;
  date?: string;
  created_at: string;
}

export default function SalesInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchSalesInquiries();
  }, []);

  // Effect to filter inquiries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInquiries(inquiries);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = inquiries.filter(inquiry => 
      inquiry.clientName.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.mobile.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.configuration.toLowerCase().includes(lowerCaseQuery) ||
      (inquiry.email && inquiry.email.toLowerCase().includes(lowerCaseQuery)) ||
      inquiry.source.toLowerCase().includes(lowerCaseQuery) ||
      inquiry.assignedEmployee.toLowerCase().includes(lowerCaseQuery) ||
      (inquiry.description && inquiry.description.toLowerCase().includes(lowerCaseQuery))
    );
    
    setFilteredInquiries(filtered);
  }, [searchQuery, inquiries]);

  const fetchSalesInquiries = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching sales inquiries...');
      
      // First, get all inquiry IDs from the Inquiry_Progress table with progress_type = 'deal_done'
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('*')
        .eq('progress_type', 'deal_done');
        
      if (progressError) {
        console.error('Error fetching from Inquiry_Progress table:', progressError);
        throw progressError;
      }
      
      // Extract the eids (inquiry ids) that have 'deal_done' progress entries
      const inquiryIdsWithDealDone = [...new Set(progressData.map(item => item.eid))];
      console.log('Unique inquiry IDs with deal_done progress:', inquiryIdsWithDealDone.length);
      
      if (inquiryIdsWithDealDone.length === 0) {
        console.log('No inquiries with deal_done progress found');
        setInquiries([]);
        setFilteredInquiries([]);
        setIsLoading(false);
        return;
      }
      
      // Query to get inquiries that have 'deal_done' progress entries
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .in('id', inquiryIdsWithDealDone);
      
      if (error) {
        console.error('Error fetching from enquiries table:', error);
        throw error;
      }

      console.log('Sales inquiries fetched:', data?.length || 0);
      
      // Ensure data is treated as EnquiryRecord[]
      const typedData = data as EnquiryRecord[];
      
      // Create a map of the most recent progress entries for each inquiry
      const latestProgressEntries = new Map<string | number, ProgressRecord>();
      
      // Sort progress entries by date and get the latest for each inquiry
      progressData.forEach(progress => {
        const existingProgress = latestProgressEntries.get(progress.eid);
        const progressDate = progress.date ? new Date(progress.date.split('/').reverse().join('-')) : new Date(progress.created_at);
        
        if (!existingProgress) {
          latestProgressEntries.set(progress.eid, progress);
        } else {
          const existingDate = existingProgress.date ? 
            new Date(existingProgress.date.split('/').reverse().join('-')) : 
            new Date(existingProgress.created_at);
            
          if (progressDate > existingDate) {
            latestProgressEntries.set(progress.eid, progress);
          }
        }
      });
      
      // Transform the data to match our Inquiry type, including progress information
      const transformedData: Inquiry[] = typedData.map(enquiry => {
        const progressEntry = latestProgressEntries.get(enquiry.id);
        
        return {
          id: enquiry.id,
          clientName: enquiry["Client Name"] || 'Unknown Client',
          mobile: enquiry.Mobile || '',
          email: enquiry.Email || '',
          configuration: enquiry.Configuration || '',
          description: enquiry.Remarks || enquiry["Last Remarks"] || '',
          status: 'deal_done',
          source: enquiry["Enquiry Source"] || 'Unknown',
          assignedEmployee: enquiry["Assigned To"] || '',
          dateCreated: String(enquiry["Created Date"] || enquiry.created_at || new Date().toISOString()),
          budget: enquiry.Budget || '',
          area: enquiry.Area || '',
          lastRemarks: enquiry["Last Remarks"] || '',
          nfd: enquiry.NFD || '',
          progressDate: progressEntry?.date || '',
          progressRemark: progressEntry?.remark || ''
        };
      });
      
      console.log('Final list of sales inquiries:', transformedData.length);
      setInquiries(transformedData);
      setFilteredInquiries(transformedData);
    } catch (error) {
      console.error('Error fetching sales inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
              <h1 className="text-3xl font-bold mb-2">Sales Inquiries</h1>
              <p className="text-[#e5d0b1] max-w-2xl">
                All inquiries with successful sales (Deal Done)
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
              placeholder="Search by client name, phone number, or configuration..." 
              defaultValue={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              Sales Inquiry List
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
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Configuration</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Sale Date</th>
                  <th>Sale Remarks</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.length > 0 ? (
                  filteredInquiries.map(inquiry => (
                    <tr key={inquiry.id}>
                      <td data-label="Client">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/enquiry/${inquiry.id}/progress`}
                              className="p-1.5 text-gray-600 hover:text-[#c69c6d] transition-colors rounded-lg hover:bg-gray-100"
                              title="View Progress"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </Link>
                          </div>
                          <div>
                            <div className="font-medium">{inquiry.clientName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{inquiry.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Configuration">
                        <div className="font-medium">{inquiry.configuration || 'N/A'}</div>
                      </td>
                      <td data-label="Source">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                          {inquiry.source}
                        </div>
                      </td>
                      <td data-label="Assigned To">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                          {inquiry.assignedEmployee}
                        </div>
                      </td>
                      <td data-label="Status">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Deal Done
                        </div>
                      </td>
                      <td data-label="Sale Date">
                        {inquiry.progressDate || '-'}
                      </td>
                      <td data-label="Sale Remarks">
                        <div className="max-w-[200px]">
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {inquiry.progressRemark || inquiry.lastRemarks || 'No remarks'}
                          </div>
                        </div>
                      </td>
                      <td data-label="Created Date">
                        {inquiry.dateCreated || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-lg font-medium mb-1">No sales inquiries found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">There are no inquiries with &apos;Deal Done&apos; status</p>
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
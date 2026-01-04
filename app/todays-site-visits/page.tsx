'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

interface SiteVisit {
  id: string;
  eid: string;
  progress_type: string;
  remark: string;
  date: string;
  clientName: string;
  mobile: string;
  created_at: string;
}

export default function TodaysSiteVisitsPage() {
  const [siteVisits, setSiteVisits] = React.useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Function to get today's date in DD/MM/YYYY format
  const getTodayDate = () => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  };

  // Fetch site visits from Inquiry_Progress table
  const fetchTodaysSiteVisits = useCallback(async () => {
    try {
      setIsLoading(true);
      const todayDate = getTodayDate();

      // Query Inquiry_Progress table for site visits scheduled today
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('*')
        .eq('progress_type', 'site_visit_schedule')
        .eq('date', todayDate)
        .order('created_at', { ascending: false }); // Get newest entries first

      if (progressError) throw progressError;

      if (!progressData || progressData.length === 0) {
        setSiteVisits([]);
        return;
      }

      // Create a Map to store the latest entry for each unique eid
      const latestVisitMap = new Map<string, any>();

      // Loop through all entries and keep only the latest one for each eid
      progressData.forEach(item => {
        if (!latestVisitMap.has(item.eid)) {
          latestVisitMap.set(item.eid, item);
        }
      });

      // Get unique eids to fetch client details
      const uniqueEids = Array.from(latestVisitMap.keys());

      // Fetch client details for all unique eids
      const { data: enquiriesData, error: enquiriesError } = await supabase
        .from('enquiries')
        .select('id, "Client Name", Mobile')
        .in('id', uniqueEids);

      if (enquiriesError) throw enquiriesError;

      // Create a map of enquiries by id for quick lookup
      const enquiriesMap = new Map(
        (enquiriesData || []).map(enq => [enq.id, enq])
      );

      console.log(`Found ${progressData.length} total site visits, filtered to ${latestVisitMap.size} unique inquiries`);

      // Transform the data into SiteVisit format, using only the latest entries
      const visits: SiteVisit[] = Array.from(latestVisitMap.values()).map(item => {
        const enquiry = enquiriesMap.get(item.eid);
        return {
          id: item.id || '',
          eid: item.eid || '',
          progress_type: item.progress_type || '',
          remark: item.remark || '',
          date: item.date || '',
          clientName: enquiry?.["Client Name"] || 'Unknown Client',
          mobile: enquiry?.Mobile || 'N/A',
          created_at: item.created_at || new Date().toISOString()
        };
      });

      setSiteVisits(visits);
    } catch (error) {
      console.error('Error fetching today\'s site visits:', error);
      // Log more detailed error information
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch site visits when component mounts
  React.useEffect(() => {
    fetchTodaysSiteVisits();
  }, [fetchTodaysSiteVisits]);

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Today&apos;s Site Visits
          </h1>
          <p className="text-[#e5d0b1] text-lg md:text-xl max-w-3xl mx-auto">
            Site visits scheduled for {getTodayDate()}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="premium-card overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Today&apos;s Site Visit Details
              </h2>
              <Link 
                href="/site-visits"
                className="premium-button"
              >
                View All Site Visits
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c69c6d]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {siteVisits.length > 0 ? (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Visit Date</th>
                      <th>Enquiry ID</th>
                      <th>Progress Type</th>
                      <th>Remarks</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-[#1a2e29]/10 dark:bg-[#c69c6d]/20 rounded-full flex items-center justify-center text-[#1a2e29] dark:text-[#c69c6d]">
                              {visit.clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{visit.clientName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{visit.mobile}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {visit.date}
                          </div>
                        </td>
                        <td>
                          <Link 
                            href={`/enquiry/${visit.eid}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d] hover:bg-[#1a2e29]/20 transition-colors"
                          >
                            {visit.eid}
                          </Link>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {visit.progress_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="max-w-[200px]">
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {visit.remark}
                            </div>
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/enquiry/${visit.eid}/edit`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                              title="Edit Inquiry"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Link>
                            <Link
                              href={`/enquiry/${visit.eid}/progress`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                              title="Add Progress"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                              </svg>
                            </Link>
                            <Link
                              href={`/enquiry/${visit.eid}/progress`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                              title="View progress history"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-lg font-medium text-gray-700 dark:text-gray-300">No site visits scheduled for today</div>
                  <p className="mt-2">There are no site visits scheduled for {getTodayDate()}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
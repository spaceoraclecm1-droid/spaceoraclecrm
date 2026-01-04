'use client';

import { useEffect, useState } from 'react';
import { Enquiry, InquirySource } from './types';
import { useInitializeData } from './utils/initializeData';
import SearchBar from './components/SearchBar';
import Link from 'next/link';
import { supabase } from './utils/supabase';
import { useAuth } from './context/AuthContext';
import { useInquiryStore } from './store/inquiryStore';

// Commented out as it's not currently used
// interface EnquiryCount {
//   total: number;
//   new: number;
// }

// Commented out as it's not currently used
// const DashboardMetricCard = ({ label, value, trend }: { label: string; value: number; trend?: number }) => (
//   <div className="bg-white rounded-lg shadow p-6">
//     <h3 className="text-gray-500 text-sm mb-1">{label}</h3>
//     <div className="flex items-end space-x-2">
//       <p className="text-2xl font-bold">{value}</p>
//       {trend !== undefined && (
//         <span className={`text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
//           {trend >= 0 ? '+' : ''}{trend}%
//         </span>
//       )}
//     </div>
//   </div>
// );

export default function Home() {
  const { user, loading } = useAuth();
  useInitializeData();
  const { setTodayInquiries } = useInquiryStore();

  const [stats, setStats] = useState({
    totalEnquiries: 0,
    newEnquiries: 0,
    pendingSiteVisits: 0,
    totalSales: 0
  });

  const [categorizedEnquiries, setCategorizedEnquiries] = useState<{
    new: Enquiry[],
    today: Enquiry[],
    yesterday: Enquiry[],
    due: Enquiry[],
    weekend: Enquiry[]
  }>({
    new: [],
    today: [],
    yesterday: [],
    due: [],
    weekend: []
  });

  const [isLoading, setIsLoading] = useState(true);

  // Helper function to format date consistently
  const formatDate = (date: Date): string => {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Helper function to compare dates (ignoring time)
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Helper function to parse DD/MM/YYYY to Date
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    return new Date(year, month, day);
  };

  // Function to fetch enquiry counts from Supabase
  const fetchEnquiryCounts = async () => {
    try {
      // First, get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');

      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }

      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = dealLostData.map(item => item.eid);
      console.log('Inquiries with deal_lost progress to exclude from counts:', dealLostInquiryIds.length);

      // Get total count, excluding deal_lost inquiries
      let totalCountQuery = supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true });

      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.length > 0) {
        totalCountQuery = totalCountQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }

      const { count: totalCount, error: totalError } = await totalCountQuery;

      if (totalError) throw totalError;

      // Get new inquiries count using the same logic as the new-inquiries page:
      // First, get all inquiry IDs from the Inquiry_Progress table
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('eid');

      if (progressError) {
        console.error('Error fetching from Inquiry_Progress table:', progressError);
        throw progressError;
      }

      // Extract the eids (inquiry ids) that have progress entries
      const inquiryIdsWithProgress = progressData.map(item => item.eid);

      // Query to count new inquiries EXCLUDING any that have matching IDs in Inquiry_Progress table
      let newInquiriesQuery = supabase
        .from('enquiries')
        .select('*', { count: 'exact', head: true })
        .eq('Enquiry Progress', 'New');

      // If there are inquiries with progress, exclude them
      if (inquiryIdsWithProgress.length > 0) {
        // This ensures that any inquiry ID that matches an eid in Inquiry_Progress is excluded
        newInquiriesQuery = newInquiriesQuery.not('id', 'in', `(${inquiryIdsWithProgress.join(',')})`);
      }

      // Also exclude deal_lost inquiries from new inquiries count
      if (dealLostInquiryIds.length > 0) {
        newInquiriesQuery = newInquiriesQuery.not('id', 'in', `(${dealLostInquiryIds.join(',')})`);
      }

      const { count: newCount, error: newError } = await newInquiriesQuery;

      if (newError) {
        console.error('Error counting new inquiries:', newError);
        throw newError;
      }

      console.log('New inquiries count (excluding those with progress and deal_lost):', newCount);

      // Get today's site visits from Inquiry_Progress table
      const today = new Date();
      const formattedDate = formatDate(today);

      // Updated site visits logic to match Today's Site Visits page
      const { data: siteVisitData, error: siteVisitsError } = await supabase
        .from('Inquiry_Progress')
        .select('*')
        .eq('progress_type', 'site_visit_schedule')
        .eq('date', formattedDate)
        .order('created_at', { ascending: false }); // Get newest entries first

      if (siteVisitsError) throw siteVisitsError;

      // Create a Map to store the latest entry for each unique eid
      const latestVisitMap = new Map<string, any>();

      // Loop through all entries and keep only the latest one for each eid
      (siteVisitData || []).forEach(item => {
        if (!latestVisitMap.has(item.eid)) {
          latestVisitMap.set(item.eid, item);
        }
      });

      console.log(`Found ${siteVisitData?.length || 0} total site visits, filtered to ${latestVisitMap.size} unique inquiries`);

      // Use the size of the Map as the count of unique site visits
      const uniqueSiteVisitsCount = latestVisitMap.size;

      // Get total deals done count from Inquiry_Progress table
      // by counting unique inquiry IDs (eids) that have 'deal_done' progress
      const { data: dealsDoneData, error: dealsError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_done');

      if (dealsError) {
        console.error('Error fetching deal_done entries:', dealsError);
        throw dealsError;
      }

      // Get unique inquiry IDs with 'deal_done' progress
      const uniqueDealDoneIds = [...new Set(dealsDoneData.map(item => item.eid))];
      const dealsDoneCount = uniqueDealDoneIds.length;

      console.log('Total sales (unique inquiries with deal_done progress):', dealsDoneCount);

      setStats(prev => ({
        ...prev,
        totalEnquiries: totalCount || 0,
        newEnquiries: newCount || 0,
        pendingSiteVisits: uniqueSiteVisitsCount || 0,
        totalSales: dealsDoneCount || 0
      }));

    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Function to fetch today's enquiries from Supabase
  const fetchTodaysEnquiries = async () => {
    try {
      // Get today's date in DD/MM/YYYY format
      const today = new Date();
      const formattedDate = formatDate(today);

      console.log('Fetching today\'s data with date:', formattedDate);

      // Fetch all 'deal_done' and 'deal_lost' inquiry IDs to exclude
      const { data: completedData, error: completedError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .in('progress_type', ['deal_done', 'deal_lost']);

      if (completedError) {
        console.error('Error fetching completed inquiry IDs:', completedError);
        throw completedError;
      }

      const completedIds = completedData.map(item => item.eid);
      console.log('Completed inquiries to exclude from today:', completedIds.length);

      // Fetch from enquiries table where NFD = today
      let query = supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', formattedDate);

      // Exclude inquiries that are marked as deal_done or deal_lost via progress
      if (completedIds.length > 0) {
        query = query.not('id', 'in', `(${completedIds.join(',')})`);
      }

      const { data: nfdData, error: nfdError } = await query;

      if (nfdError) throw nfdError;

      console.log('Enquiries with NFD = today (after excluding completed):', nfdData?.length || 0);

      // Transform the NFD data to match the Enquiry type
      const nfdTransformedData: Enquiry[] = (nfdData || []).map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"]?.toLowerCase() || 'active',
        source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        category: 'today'
      }));

      return nfdTransformedData;
    } catch (error) {
      console.error('Error fetching today\'s enquiries:', error);
      return [];
    }
  };

  // Function to fetch due enquiries from Supabase (NFD older than today)
  const fetchDueEnquiries = async () => {
    try {
      // Get current date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      
      // Parse today's date for comparison
      const [todayDay, todayMonth, todayYear] = todayFormatted.split('/').map(Number);
      
      // Create Date object for today (with time set to midnight)
      const todayDate = new Date(todayYear, todayMonth - 1, todayDay);

      console.log('Fetching due inquiries (before today)');
      
      // Get inquiry IDs from the Inquiry_Progress table that have "deal_lost" progress type
      const { data: dealLostData, error: dealLostError } = await supabase
        .from('Inquiry_Progress')
        .select('eid')
        .eq('progress_type', 'deal_lost');
        
      if (dealLostError) {
        console.error('Error fetching deal_lost entries from Inquiry_Progress table:', dealLostError);
        throw dealLostError;
      }
      
      // Extract the eids (inquiry ids) that have deal_lost progress entries
      const dealLostInquiryIds = new Set(dealLostData.map(item => item.eid));
      console.log('Inquiries with deal_lost progress to exclude from due inquiries:', dealLostInquiryIds.size);
      
      // Fetch all enquiries
      let enquiriesQuery = supabase
        .from('enquiries')
        .select('*');
        
      // Exclude inquiries with deal_lost progress if there are any
      if (dealLostInquiryIds.size > 0) {
        const dealLostArray = Array.from(dealLostInquiryIds);
        enquiriesQuery = enquiriesQuery.not('id', 'in', `(${dealLostArray.join(',')})`);
      }
      
      const { data, error } = await enquiriesQuery;

      if (error) throw error;

      // Filter inquiries using ONLY the NFD logic:
      // NFD is earlier than today (not including today)
      const filteredData = (data || []).filter(enquiry => {
        // Skip if no NFD
        if (!enquiry.NFD) return false;

        // Parse the NFD date
        const [day, month, year] = enquiry.NFD.split('/').map(Number);
        
        // Check if this is a valid date
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        
        // Create Date object for NFD (with time set to midnight)
        const nfdDate = new Date(year, month - 1, day);
        
        // The only condition: NFD is earlier than today
        return nfdDate < todayDate;
      });

      console.log('Due enquiries (NFD earlier than today):', filteredData.length);

      // Transform the data to match the Enquiry type
      const transformedData: Enquiry[] = filteredData.map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"]?.toLowerCase() || 'active',
        source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        category: 'due'
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching due enquiries:', error);
      return [];
    }
  };

  // Function to fetch yesterday's enquiries from Supabase
  const fetchYesterdaysEnquiries = async () => {
    try {
      // Get yesterday's date
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayFormatted = formatDate(yesterday);

      console.log('Fetching yesterday\'s data with date:', yesterdayFormatted);

      // Fetch enquiries where NFD is yesterday
      const { data, error } = await supabase
        .from('enquiries')
        .select('*')
        .eq('NFD', yesterdayFormatted);

      if (error) throw error;

      console.log('Yesterday\'s enquiries found:', data?.length || 0);

      // Transform the data to match the Enquiry type
      const transformedData: Enquiry[] = (data || []).map(enquiry => ({
        id: enquiry.id,
        clientName: enquiry["Client Name"] || 'Unknown Client',
        mobile: enquiry.Mobile || '',
        configuration: enquiry.Configuration || '',
        description: enquiry["Last Remarks"] || '',
        status: enquiry["Enquiry Progress"]?.toLowerCase() || 'active',
        source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
        assignedEmployee: enquiry["Assigned To"] || '',
        dateCreated: enquiry["Created Date"] || new Date().toISOString(),
        category: 'yesterday'
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching yesterday\'s enquiries:', error);
      return [];
    }
  };

  // Only run the data fetching if we're authenticated
  useEffect(() => {
    if (user && !loading) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Fetch inquiry counts for the stats cards
          await fetchEnquiryCounts();

          // Fetch all inquiry categories in parallel
          const [todayInquiries, dueInquiries, yesterdayInquiries, newInquiries] = await Promise.all([
            fetchTodaysEnquiries(),
            fetchDueEnquiries(),
            fetchYesterdaysEnquiries(),
            // Fetch new inquiries
            (async () => {
              try {
                // First, get inquiry IDs from the Inquiry_Progress table
                const { data: progressData, error: progressError } = await supabase
                  .from('Inquiry_Progress')
                  .select('eid');

                if (progressError) {
                  throw progressError;
                }

                // Extract the eids (inquiry ids) that have progress entries
                const inquiryIdsWithProgress = progressData.map(item => item.eid);

                // Query to get new inquiries EXCLUDING any that have matching IDs in Inquiry_Progress table
                let newInquiriesQuery = supabase
                  .from('enquiries')
                  .select('*')
                  .eq('Enquiry Progress', 'New');

                // If there are inquiries with progress, exclude them
                if (inquiryIdsWithProgress.length > 0) {
                  newInquiriesQuery = newInquiriesQuery.not('id', 'in', `(${inquiryIdsWithProgress.join(',')})`);
                }

                const { data: newInquiriesData, error: newInquiriesError } = await newInquiriesQuery;

                if (newInquiriesError) {
                  throw newInquiriesError;
                }

                console.log('New inquiries fetched:', newInquiriesData?.length || 0);

                // Transform the new inquiries data to match the Enquiry type
                const newInquiries = (newInquiriesData || []).map(enquiry => ({
                  id: enquiry.id,
                  clientName: enquiry["Client Name"] || 'Unknown Client',
                  mobile: enquiry.Mobile || '',
                  configuration: enquiry.Configuration || '',
                  description: enquiry["Last Remarks"] || '',
                  status: enquiry["Enquiry Progress"]?.toLowerCase() || 'new',
                  source: (enquiry["Enquiry Source"] || 'REF') as InquirySource,
                  assignedEmployee: enquiry["Assigned To"] || '',
                  dateCreated: enquiry["Created Date"] || new Date().toISOString(),
                  category: 'new' as const
                }));

                return newInquiries;
              } catch (error) {
                console.error('Error fetching new inquiries:', error);
                return [];
              }
            })()
          ]);

          // Update state with all categories
          setCategorizedEnquiries({
            today: todayInquiries || [],
            due: dueInquiries || [],
            yesterday: yesterdayInquiries || [],
            new: newInquiries || [],
            weekend: [] // We no longer use this category
          });

          // Store today's inquiries in the global store for sharing with Today Inquiries page
          setTodayInquiries(todayInquiries || []);

          console.log('Dashboard data loaded successfully:');
          console.log('- Today:', todayInquiries?.length || 0);
          console.log('- Due:', dueInquiries?.length || 0);
          console.log('- Yesterday:', yesterdayInquiries?.length || 0);
          console.log('- New:', newInquiries?.length || 0);

        } catch (error) {
          console.error('Error loading dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }
  }, [user, loading]);

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
      </div>
    );
  }

  const handleSearch = (query: string) => {
    console.log('Dashboard search:', query);
    // No need to filter data here as we'll redirect to the inquiry list page
  };

  // Sample data - commented out as not currently used
  // const metrics = {
  //   totalSales: 125,
  //   salesTrend: 12,
  //   activeInquiries: 45,
  //   inquiriesTrend: 8,
  //   siteVisits: 28,
  //   siteVisitsTrend: -5,
  //   conversionRate: 15,
  // };

  return (
    <div className="fade-in">
      {/* Premium Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>

        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Welcome to <span className="text-[#c69c6d]">Space Oracle CRM</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-[1px] w-12 bg-[#c69c6d]/50"></div>
            <p className="text-[#e5d0b1] text-lg md:text-xl italic tracking-wide animate-pulse-subtle">
              Delivering Spaces Where Dreams Thrive
            </p>
            <div className="h-[1px] w-12 bg-[#c69c6d]/50"></div>
          </div>

          <div className="max-w-2xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search properties, clients, or enquiries..."
              submitOnEnter={true}
              redirectUrl="/enquiry/list"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c69c6d]"></div>
        </div>
      ) : (
        <div className="space-y-10 px-2 sm:px-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="New Enquiries"
              value={stats.newEnquiries}
              icon={<NewIcon />}
              href="/new-inquiries"
              color="blue"
            />
            <StatCard
              title="Total Enquiries"
              value={stats.totalEnquiries}
              icon={<DocumentIcon />}
              href="/enquiry/list"
              color="green"
            />
            <StatCard
              title="Today's Site Visits"
              value={stats.pendingSiteVisits}
              icon={<CalendarIcon />}
              href="/todays-site-visits"
              color="purple"
            />
            <StatCard
              title="Sales"
              value={stats.totalSales}
              icon={<CurrencyIcon />}
              href="/sales-inquiries"
              color="gold"
            />
          </div>

          {/* Quick Actions Section */}
          <div className="bg-gradient-to-r from-[#1a2e29]/10 to-[#264a42]/10 rounded-xl p-6 border border-[#c69c6d]/20">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/enquiry/new"
                className="flex items-center gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">New Enquiry</span>
              </Link>
              
              <Link
                href="/reports/employee-inquiry"
                className="flex items-center gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Reports</span>
              </Link>
              
              <Link
                href="/site-visits"
                className="flex items-center gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Site Visits</span>
              </Link>
              
              <Link
                href="/housing-integration"
                className="flex items-center gap-3 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg hover:bg-white/90 dark:hover:bg-gray-800/90 transition-colors border-2 border-[#c69c6d]/30"
              >
                <div className="h-10 w-10 rounded-full bg-[#c69c6d]/20 flex items-center justify-center text-[#c69c6d]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Housing Integration</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
              {/* Categorized Enquiries */}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="inline-block w-1.5 h-5 bg-[#c69c6d] rounded-full mr-2"></span>
                Enquiries by Category
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                <CategoryCard
                  title="New"
                  count={categorizedEnquiries.new.length}
                  icon={<NewIcon />}
                  enquiries={categorizedEnquiries.new}
                  colorClass="from-blue-500/20 to-blue-600/20 border-blue-200 dark:border-blue-800/30"
                />
                <CategoryCard
                  title="Today"
                  count={categorizedEnquiries.today.length}
                  icon={<TodayIcon />}
                  enquiries={categorizedEnquiries.today}
                  colorClass="from-green-500/20 to-green-600/20 border-green-200 dark:border-green-800/30"
                />
                <CategoryCard
                  title="Due"
                  count={categorizedEnquiries.due.length}
                  icon={<DueIcon />}
                  enquiries={categorizedEnquiries.due}
                  colorClass="from-orange-500/20 to-orange-600/20 border-orange-200 dark:border-orange-800/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <CategoryCard
                  title="Yesterday"
                  count={categorizedEnquiries.yesterday.length}
                  icon={<YesterdayIcon />}
                  enquiries={categorizedEnquiries.yesterday}
                  colorClass="from-purple-500/20 to-purple-600/20 border-purple-200 dark:border-purple-800/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon, href, color = 'default' }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
  color?: 'blue' | 'green' | 'purple' | 'gold' | 'default';
}) => {
  const getColorClass = () => {
    switch(color) {
      case 'blue':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800/30';
      case 'green':
        return 'bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-100 dark:border-green-800/30';
      case 'purple':
        return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-100 dark:border-purple-800/30';
      case 'gold':
        return 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-100 dark:border-amber-800/30';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-100 dark:border-gray-800/30';
    }
  };

  // Get the href with date parameter for Today's Site Visits
  const getHref = () => {
    if (title === "Today's Site Visits") {
      return '/todays-site-visits';
    }
    if (title === "New Enquiries") {
      return '/new-inquiries';
    }
    if (title === "Sales") {
      return '/sales-inquiries';
    }
    return href || '#';
  };

  return (
    <Link href={getHref()} className="block">
      <div className={`p-4 sm:p-6 rounded-xl border transition-transform duration-300 hover:scale-105 hover:shadow-md ${getColorClass()}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center text-[#c69c6d] flex-shrink-0">
            {icon}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const CategoryCard = ({ title, count, icon, enquiries, colorClass }: {
  title: string;
  count: number;
  icon: React.ReactNode;
  enquiries: Enquiry[];
  colorClass: string;
}) => {
  // Type that extends Enquiry with optional progressType is still needed for the view all link
  type EnquiryWithProgress = Enquiry & { progressType?: string };

  // Convert title to category value for filtering
  const getCategoryValue = (title: string) => {
    return title.toLowerCase();
  };

  // Get the search parameter based on category
  const getLink = (title: string) => {
    if (title === 'Today') {
      // Link to the dedicated today-inquiries page for Today category
      return '/today-inquiries';
    } else if (title === 'New') {
      // Link to the dedicated new-inquiries page for New category
      return '/new-inquiries';
    } else if (title === 'Due') {
      // Link to the dedicated due-inquiries page for Due category
      return '/due-inquiries';
    } else if (title === 'Yesterday') {
      // Link to the dedicated yesterday-inquiries page for Yesterday category
      return '/yesterday-inquiries';
    } else if (title === 'Weekend') {
      // Link to the dedicated weekend-inquiries page for Weekend category
      return '/weekend-inquiries';
    }
    return `/enquiry/list?category=${getCategoryValue(title)}`;
  };

  return (
    <div className={`p-5 rounded-xl bg-gradient-to-br border transition-all hover:shadow-md ${colorClass}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <div className="text-lg font-bold text-gray-800 dark:text-white">{title}</div>
          <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{count}</div>
        </div>
        <div className="h-14 w-14 rounded-full bg-white/70 dark:bg-gray-800/70 flex items-center justify-center text-[#c69c6d]">
          {icon}
        </div>
      </div>

      {count > 0 ? (
        <Link
          href={getLink(title)}
          className="w-full block text-center py-3 px-4 rounded-lg bg-white/70 dark:bg-gray-900/40 text-[#1a2e29] dark:text-white hover:bg-white/90 dark:hover:bg-gray-900/60 transition-colors text-sm font-medium"
        >
          View All {count > 0 ? `(${count})` : ''}
        </Link>
      ) : (
        <div className="text-center py-3 px-4 rounded-lg bg-white/50 dark:bg-gray-900/30">
          <div className="text-gray-500 dark:text-gray-400">No {title.toLowerCase()} inquiries</div>
        </div>
      )}
    </div>
  );
};

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TodayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const YesterdayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const DueIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const WeekendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

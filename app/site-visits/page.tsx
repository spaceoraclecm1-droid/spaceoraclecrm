'use client';

import React from 'react';
import SiteVisitList from '../components/SiteVisitList';
import ScheduleVisitForm from '../components/ScheduleVisitForm';
import { supabase } from '../utils/supabase';

interface SiteVisit {
  id: string;
  inquiryId: string;
  clientName: string;
  mobile: string;
  scheduledDate: string;
  status: 'scheduled' | 'done' | 'cancelled';
  remarks: string;
  assignedTo: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function SiteVisitsPage() {
  const [showScheduleForm, setShowScheduleForm] = React.useState(false);
  const [siteVisits, setSiteVisits] = React.useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSiteVisits = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all enquiries
      const { data: enquiries, error: enquiriesError } = await supabase
        .from('enquiries')
        .select('*');

      if (enquiriesError) throw enquiriesError;

      // Filter and transform enquiries into site visits
      const visits: SiteVisit[] = enquiries
        .filter(enquiry => 
          enquiry["Enquiry Progress"]?.toLowerCase().includes('site visit') ||
          enquiry["Last Remarks"]?.toLowerCase().includes('site visit')
        )
        .map(enquiry => ({
          id: enquiry.id,
          inquiryId: enquiry.id,
          clientName: enquiry["Client Name"] || 'Unknown Client',
          mobile: enquiry["Mobile"] || 'N/A',
          scheduledDate: enquiry["NFD"] || new Date().toISOString(), // Using Next Follow-up Date as scheduled date
          status: enquiry["Enquiry Progress"]?.toLowerCase().includes('done') ? 'done' :
                 enquiry["Enquiry Progress"]?.toLowerCase().includes('cancelled') ? 'cancelled' : 'scheduled',
          remarks: enquiry["Last Remarks"] || '',
          assignedTo: enquiry["Assigned To"] || 'Unassigned',
          createdBy: enquiry["Created By"] || 'System',
          updatedBy: enquiry["Updated By"] || 'System',
          createdAt: enquiry["Created Date"] || new Date().toISOString(),
          updatedAt: enquiry["Updated Date"] || new Date().toISOString()
        }));

      setSiteVisits(visits);
    } catch (error) {
      console.error('Error fetching site visits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch site visits when component mounts
  React.useEffect(() => {
    fetchSiteVisits();
  }, []);

  const handleMarkCompleted = async (id: string) => {
    try {
      // Update the enquiry status
      const { error } = await supabase
        .from('enquiries')
        .update({
          "Enquiry Progress": "Site Visit Done",
          "Updated Date": new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh the site visits list
      await fetchSiteVisits();
    } catch (error) {
      console.error('Error marking visit as completed:', error);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      // Update the enquiry status
      const { error } = await supabase
        .from('enquiries')
        .update({
          "Enquiry Progress": "Site Visit Cancelled",
          "Updated Date": new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh the site visits list
      await fetchSiteVisits();
    } catch (error) {
      console.error('Error cancelling visit:', error);
    }
  };

  return (
    <div className="fade-in">
      {/* Premium Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e29]/90 to-[#264a42]/90 rounded-2xl -z-10"></div>
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10 mix-blend-overlay rounded-2xl -z-10"></div>
        
        <div className="relative py-14 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Site Visits
          </h1>
          <p className="text-[#e5d0b1] text-lg md:text-xl max-w-3xl mx-auto">
            Manage and track all property site visits
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Today&apos;s Site Visits</h2>
              <button 
                onClick={() => setShowScheduleForm(true)}
                className="premium-button"
              >
                Schedule New Visit
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#c69c6d]"></div>
            </div>
          ) : (
            <SiteVisitList 
              siteVisits={siteVisits}
              onMarkCompleted={handleMarkCompleted}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>

      {showScheduleForm && (
        <ScheduleVisitForm
          onClose={() => setShowScheduleForm(false)}
          onSubmit={async (visit) => {
            try {
              // Update the enquiry with site visit details
              const { error } = await supabase
                .from('enquiries')
                .update({
                  "Enquiry Progress": "Site Visit Scheduled",
                  "Last Remarks": visit.remarks,
                  "NFD": visit.scheduledDate,
                  "Updated Date": new Date().toISOString()
                })
                .eq('id', visit.inquiryId);

              if (error) throw error;

              // Refresh the site visits list
              await fetchSiteVisits();
              setShowScheduleForm(false);
            } catch (error) {
              console.error('Error scheduling visit:', error);
            }
          }}
        />
      )}
    </div>
  );
} 
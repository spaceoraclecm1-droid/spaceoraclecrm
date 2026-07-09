'use client';

import React, { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../utils/supabase';
import InquiryProgressForm from '../../../components/InquiryProgressForm';
import EditInquiryProgressForm from '../../../components/EditInquiryProgressForm';
import ConfirmationDialog from '../../../components/ConfirmationDialog';

const getProgressTypeLabel = (type: InquiryProgressType): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getProgressTypeColor = (type: InquiryProgressType): string => {
  switch (type) {
    case 'phone_call':
      return 'bg-blue-100 text-blue-800';
    case 'site_visit':
      return 'bg-green-100 text-green-800';
    case 'follow_up':
      return 'bg-purple-100 text-purple-800';
    case 'negotiation':
      return 'bg-yellow-100 text-yellow-800';
    case 'document_collection':
      return 'bg-orange-100 text-orange-800';
    case 'payment_discussion':
      return 'bg-pink-100 text-pink-800';
    case 'deal_closure':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface InquiryData {
  "Remarks": string;
  "Last Remarks": string;
  "Client Name": string;
}

type InquiryProgressType = 
  | 'phone_call' 
  | 'site_visit' 
  | 'follow_up' 
  | 'meeting' 
  | 'email' 
  | 'negotiation'
  | 'document_collection'
  | 'payment_discussion'
  | 'deal_closure'
  | 'other';

interface InquiryProgressData {
  id: string;
  eid: string;
  progress_type: InquiryProgressType;
  remark: string;
  date: string;
  created_at: string;
}

export default function InquiryProgressPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id as string;
  
  const [progressHistory, setProgressHistory] = React.useState<InquiryProgressData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddProgress, setShowAddProgress] = React.useState(false);
  const [inquiryData, setInquiryData] = React.useState<InquiryData | null>(null);
  
  // New state for edit and delete functionality
  const [showEditProgress, setShowEditProgress] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<InquiryProgressData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchInquiryData = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch old enquiry remarks and client name
      const { data: enquiryData, error: enquiryError } = await supabase
        .from('enquiries')
        .select('Remarks, "Last Remarks", "Client Name"')
        .eq('id', id)
        .single();

      if (enquiryError) throw enquiryError;
      
      const typedData: InquiryData = {
        "Remarks": enquiryData?.Remarks || '',
        "Last Remarks": enquiryData?.["Last Remarks"] || '',
        "Client Name": enquiryData?.["Client Name"] || ''
      };
      
      setInquiryData(typedData);

      // Fetch Inquiry_Progress data
      const { data: progressData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .select('*')
        .eq('eid', id)
        .order('created_at', { ascending: false });

      if (progressError) throw progressError;

      // Combine both types of data
      const combinedProgress: InquiryProgressData[] = [];

      // Add Inquiry_Progress entries
      if (progressData) {
        combinedProgress.push(...progressData);
      }

      // Add Last Remarks as the most recent item if it exists
      if (typedData["Last Remarks"]) {
        combinedProgress.push({
          id: 'last-remarks',
          eid: id,
          progress_type: 'follow_up' as InquiryProgressType,
          remark: typedData["Last Remarks"],
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        });
      }

      // Add Remarks as an older item if it exists
      if (typedData["Remarks"]) {
        combinedProgress.push({
          id: 'remarks',
          eid: id,
          progress_type: 'phone_call' as InquiryProgressType,
          remark: typedData["Remarks"],
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago
          created_at: new Date(Date.now() - 86400000).toISOString()
        });
      }

      setProgressHistory(combinedProgress);
    } catch (error) {
      console.error('Error fetching inquiry data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch inquiry data from Supabase
  React.useEffect(() => {
    fetchInquiryData();
  }, [fetchInquiryData]);

  // Function to handle delete progress
  const handleDeleteProgress = async () => {
    if (!selectedProgress) return;
    
    try {
      setIsDeleting(true);
      
      // Special handling for 'last-remarks' and 'remarks' which are stored in the enquiries table
      if (selectedProgress.id === 'last-remarks') {
        // Clear Last Remarks in enquiries table
        const { error } = await supabase
          .from('enquiries')
          .update({
            "Last Remarks": ''
          })
          .eq('id', id);

        if (error) throw error;
      } else if (selectedProgress.id === 'remarks') {
        // Clear Remarks in enquiries table
        const { error } = await supabase
          .from('enquiries')
          .update({
            "Remarks": ''
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        // Delete from Inquiry_Progress table
        const { error } = await supabase
          .from('Inquiry_Progress')
          .delete()
          .eq('id', selectedProgress.id);

        if (error) throw error;
      }
      
      // Refresh data and close confirmation dialog
      await fetchInquiryData();
      setShowDeleteConfirmation(false);
      setSelectedProgress(null);
      
    } catch (error) {
      console.error('Error deleting progress:', error);
      if (error instanceof Error) {
        alert(`Error deleting progress: ${error.message}`);
      } else {
        alert('Error deleting progress. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to open edit modal for a progress
  const handleEditClick = (progress: InquiryProgressData) => {
    setSelectedProgress(progress);
    setShowEditProgress(true);
  };
  
  // Function to open delete confirmation for a progress
  const handleDeleteClick = (progress: InquiryProgressData) => {
    setSelectedProgress(progress);
    setShowDeleteConfirmation(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <button
              onClick={() => window.history.back()}
              className="text-blue-500 hover:text-blue-600 mb-2 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Inquiry Progress History</h1>
            {inquiryData && (
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Client: {inquiryData["Client Name"]}</p>
            )}
          </div>
          <button
            onClick={() => setShowAddProgress(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors sm:self-start w-full sm:w-auto"
          >
            Add Progress
          </button>
        </div>
      </div>

      {/* Progress History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added At
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {progressHistory.map((progress) => (
                  <tr key={progress.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {progress.date}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-1.5 sm:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getProgressTypeColor(progress.progress_type)}`}>
                        {getProgressTypeLabel(progress.progress_type)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 max-w-[150px] sm:max-w-xs truncate">
                      {progress.remark}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {new Date(progress.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(progress)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(progress)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {progressHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
                      No progress history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile View for Progress History (Responsive Alternative) */}
      <div className="md:hidden mt-4">
        <div className="text-sm text-gray-500 mb-2">Scroll horizontally to see all data →</div>
      </div>

      {/* Add Progress Modal */}
      {showAddProgress && (
        <InquiryProgressForm
          inquiryId={id}
          onClose={() => setShowAddProgress(false)}
          onSuccess={fetchInquiryData}
        />
      )}

      {/* Edit Progress Modal */}
      {showEditProgress && selectedProgress && (
        <EditInquiryProgressForm
          progressId={selectedProgress.id}
          eid={id}
          initialData={{
            progressType: selectedProgress.progress_type,
            remarks: selectedProgress.remark,
            date: selectedProgress.date,
          }}
          onClose={() => {
            setShowEditProgress(false);
            setSelectedProgress(null);
          }}
          onSuccess={fetchInquiryData}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && selectedProgress && (
        <ConfirmationDialog
          title="Delete Progress Entry"
          message={`Are you sure you want to delete this progress entry? This action cannot be undone.`}
          onConfirm={handleDeleteProgress}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setSelectedProgress(null);
          }}
          isProcessing={isDeleting}
        />
      )}
    </div>
  );
} 
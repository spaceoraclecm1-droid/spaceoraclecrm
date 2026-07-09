import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import DatePickerInput from './DatePickerInput';

interface EditInquiryProgressFormProps {
  progressId: string;
  eid: string;
  initialData: {
    progressType: string;
    remarks: string;
    date: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditInquiryProgressForm({ 
  progressId, 
  eid, 
  initialData, 
  onClose, 
  onSuccess 
}: EditInquiryProgressFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    progressType: initialData.progressType,
    remarks: initialData.remarks,
    date: initialData.date
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBack = () => {
    // Use browser history to go back to the previous page
    window.history.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);

      // Special handling for 'last-remarks' and 'remarks' which are stored in the enquiries table
      if (progressId === 'last-remarks') {
        // Update Last Remarks in enquiries table
        const { error } = await supabase
          .from('enquiries')
          .update({
            "Last Remarks": formData.remarks
          })
          .eq('id', eid);

        if (error) throw error;
      } else if (progressId === 'remarks') {
        // Update Remarks in enquiries table
        const { error } = await supabase
          .from('enquiries')
          .update({
            "Remarks": formData.remarks
          })
          .eq('id', eid);

        if (error) throw error;
      } else {
        // Update in Inquiry_Progress table
        const updateProgressData: {
          progress_type: string;
          remark: string;
          date?: string;
        } = {
          progress_type: formData.progressType,
          remark: formData.remarks,
        };
        
        // Only include date if it's provided
        if (formData.date) {
          updateProgressData.date = formData.date;
        }
        
        const { error } = await supabase
          .from('Inquiry_Progress')
          .update(updateProgressData)
          .eq('id', progressId);

        if (error) throw error;
        
        // Format progress type for display (convert snake_case to Title Case)
        const formattedProgressType = formData.progressType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Prepare update data for the enquiries table
        const updateData: { [key: string]: string } = {
          "Last Remarks": formData.remarks,
          "Enquiry Progress": formattedProgressType // Also update the Enquiry Progress field
        };
        
        // Only update NFD if date is provided
        if (formData.date) {
          updateData["NFD"] = formData.date;
        }
        
        console.log('Updating enquiry with data:', updateData);
        
        // Update the enquiries table with the same date and progress type
        const { error: updateError } = await supabase
          .from('enquiries')
          .update(updateData)
          .eq('id', eid);

        if (updateError) {
          console.error('Error updating enquiry data:', updateError);
          throw updateError;
        }

        console.log('Updated enquiry successfully with progress type:', formattedProgressType);
      }

      // Call success callback
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error updating progress:', error);
      if (error instanceof Error) {
        alert(`Error updating progress: ${error.message}`);
      } else {
        alert('Error updating progress. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Edit Progress</h2>
          <button
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress Type</label>
            <select
              name="progressType"
              value={formData.progressType}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2"
              required
              disabled={progressId === 'last-remarks' || progressId === 'remarks'}
            >
              <option value="phone_call">Phone Call</option>
              <option value="site_visit">Site Visit</option>
              <option value="deal_done">Deal Done</option>
              <option value="deal_lost">Deal Lost</option>
              <option value="brochure_sent">Brochure and Details Sent</option>
              <option value="call_not_received">Call Not Received</option>
              <option value="phone_switch_off">Phone Switch Off</option>
              <option value="site_visit_schedule">Site Visit Schedule</option>
              <option value="hold">Hold for Some Time</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea 
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              rows={3}
              placeholder="Enter remarks..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date (DD/MM/YYYY)</label>
            <DatePickerInput
              name="date"
              value={formData.date}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSaving}
              className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2.5 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Update Progress'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import DatePickerInput from './DatePickerInput';

interface InquiryProgressFormProps {
  inquiryId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InquiryProgressForm({ inquiryId, onClose, onSuccess }: InquiryProgressFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    progressType: 'phone_call',
    remarks: '',
    date: ''
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

      // Validate that inquiryId is a valid number
      const numericId = parseInt(inquiryId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid inquiry ID');
      }

      // Create a data object for the Inquiry_Progress table
      const progressData: {
        eid: number;
        progress_type: string;
        remark: string;
        date?: string;
        created_at: string;
      } = {
        eid: numericId,
        progress_type: formData.progressType,
        remark: formData.remarks,
        created_at: new Date().toISOString()
      };
      
      // Only add date if it's provided
      if (formData.date) {
        progressData.date = formData.date;
      }

      // Insert into Inquiry_Progress table
      const { data: insertedData, error: progressError } = await supabase
        .from('Inquiry_Progress')
        .insert(progressData)
        .select();

      if (progressError) {
        console.error('Progress insert error:', progressError);
        throw progressError;
      }

      // Update NFD and other fields in the inquiries table
      // Prepare update data - always update Last Remarks
      const updateData: { [key: string]: string } = {
        "Last Remarks": formData.remarks
      };
      
      // Only update NFD if date is provided
      if (formData.date) {
        updateData["NFD"] = formData.date;
      }
      
      // Also update the Enquiry Progress field based on progressType
      updateData["Enquiry Progress"] = formData.progressType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log('Updating inquiry with data:', updateData);
      
      const { error: updateError } = await supabase
        .from('enquiries')
        .update(updateData)
        .eq('id', inquiryId);

      if (updateError) {
        console.error('Error updating inquiry in enquiries table:', updateError);
        throw updateError;
      }

      console.log('Updated inquiry in inquiries table successfully');

      // If we get here, everything was successful
      console.log('Progress saved successfully:', insertedData);

      // Reset form and close modal
      setFormData({
        progressType: 'phone_call',
        remarks: '',
        date: ''
      });
      
      // Call success callback
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error saving progress:', error);
      if (error instanceof Error) {
        alert(`Error saving progress: ${error.message}`);
      } else {
        alert('Error saving progress. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-black">Add New Progress</h2>
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
            <label className="block text-sm font-medium text-black mb-1">Progress Type</label>
            <select
              name="progressType"
              value={formData.progressType}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base py-2 text-black"
              required
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
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-1">Remarks</label>
            <textarea 
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base text-black"
              rows={3}
              placeholder="Enter remarks..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">Date (DD/MM/YYYY)</label>
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
                'Save Progress'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
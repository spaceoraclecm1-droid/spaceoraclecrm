import React from 'react';
import { supabase } from '../utils/supabase';
import DatePickerInput from './DatePickerInput';

interface ScheduleVisitFormProps {
  onClose: () => void;
  onSubmit: (visit: {
    inquiryId: string;
    scheduledDate: string;
    remarks: string;
  }) => void;
}

export default function ScheduleVisitForm({ onClose, onSubmit }: ScheduleVisitFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    inquiryId: '',
    scheduledDate: '',
    remarks: ''
  });
  const [enquiries, setEnquiries] = React.useState<Array<{ id: string; "Client Name": string }>>([]);

  // Fetch enquiries when component mounts
  React.useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const { data, error } = await supabase
          .from('enquiries')
          .select('id, "Client Name"')
          .order('Created Date', { ascending: false });

        if (error) throw error;
        setEnquiries(data || []);
      } catch (error) {
        console.error('Error fetching enquiries:', error);
      }
    };

    fetchEnquiries();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error scheduling visit:', error);
      if (error instanceof Error) {
        alert(`Error scheduling visit: ${error.message}`);
      } else {
        alert('Error scheduling visit. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Schedule New Site Visit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Client</label>
            <select
              name="inquiryId"
              value={formData.inquiryId}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a client...</option>
              {enquiries.map(enquiry => (
                <option key={enquiry.id} value={enquiry.id}>
                  {enquiry["Client Name"]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Visit Date (DD/MM/YYYY)</label>
            <DatePickerInput
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Remarks</label>
            <textarea 
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Enter remarks..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Schedule Visit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
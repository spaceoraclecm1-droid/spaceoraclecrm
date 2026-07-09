import React from 'react';
import { Enquiry } from '../types';

// Create type aliases for the Enquiry fields to match the interface
type InquirySource = 'REF' | 'FACEBOOK' | 'SB-VAISHNO' | 'PORTAL';
type InquiryStatus = 'active' | 'inactive' | 'new' | 'due' | 'in_progress' | 'site_visit_scheduled' | 'site_visit_done' | 'deal_succeeded' | 'deal_lost';

interface EditInquiryFormProps {
  inquiry: Enquiry;
  onSave: (updatedInquiry: Enquiry) => void;
  onCancel: () => void;
}

const EditInquiryForm: React.FC<EditInquiryFormProps> = ({
  inquiry,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = React.useState({
    clientName: inquiry.clientName,
    mobile: inquiry.mobile,
    configuration: inquiry.configuration,
    description: inquiry.description,
    source: inquiry.source,
    assignedEmployee: inquiry.assignedEmployee,
    status: inquiry.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...inquiry,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold mb-4">Edit Inquiry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Configuration</label>
              <input
                type="text"
                value={formData.configuration}
                onChange={(e) => setFormData(prev => ({ ...prev, configuration: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as InquirySource }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="REF">Reference</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="SB-VAISHNO">SB-VAISHNO</option>
                <option value="PORTAL">Portal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned To</label>
              <select
                value={formData.assignedEmployee}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedEmployee: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="Rajdeep">Rajdeep</option>
                <option value="Rushiraj">Rushiraj</option>
                <option value="Mantik">Mantik</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InquiryStatus }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="site_visit_scheduled">Site Visit Scheduled</option>
                <option value="site_visit_done">Site Visit Done</option>
                <option value="deal_succeeded">Deal Succeeded</option>
                <option value="deal_lost">Deal Lost</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInquiryForm; 
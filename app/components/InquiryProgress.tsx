import React from 'react';
import { InquiryProgress, InquiryStatus } from '../types/inquiry';

interface InquiryProgressProps {
  progress: InquiryProgress;
  onStatusChange?: (status: InquiryStatus) => void;
  onRemarkAdd?: (remark: string) => void;
  isEditable?: boolean;
}

const getStatusColor = (status: InquiryStatus): string => {
  switch (status) {
    case 'site_visit_done':
      return 'bg-amber-500'; // Golden
    case 'deal_succeeded':
      return 'bg-green-500'; // Green
    case 'deal_lost':
      return 'bg-red-500'; // Red
    default:
      return 'bg-blue-500';
  }
};

const InquiryProgressTracker: React.FC<InquiryProgressProps> = ({
  progress,
  onStatusChange,
  onRemarkAdd,
  isEditable = false,
}) => {
  const [newRemark, setNewRemark] = React.useState('');

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange?.(event.target.value as InquiryStatus);
  };

  const handleRemarkSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (newRemark.trim()) {
      onRemarkAdd?.(newRemark);
      setNewRemark('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(progress.status)}`} />
          <span className="font-medium">Current Status:</span>
          {isEditable ? (
            <select
              value={progress.status}
              onChange={handleStatusChange}
              className="border rounded px-2 py-1"
            >
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="site_visit_scheduled">Site Visit Scheduled</option>
              <option value="site_visit_done">Site Visit Done</option>
              <option value="deal_succeeded">Deal Succeeded</option>
              <option value="deal_lost">Deal Lost</option>
            </select>
          ) : (
            <span className="capitalize">{progress.status.replace(/_/g, ' ')}</span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          Last updated: {progress.updatedAt.toLocaleDateString()}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Latest Remark</h3>
        <p className="text-gray-700 bg-gray-50 p-2 rounded">
          {progress.remarks || 'No remarks yet'}
        </p>
      </div>

      {isEditable && (
        <form onSubmit={handleRemarkSubmit} className="mt-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="Add a new remark..."
              className="flex-1 border rounded px-3 py-1"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InquiryProgressTracker; 
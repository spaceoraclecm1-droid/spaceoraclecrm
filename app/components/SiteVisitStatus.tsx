import React from 'react';
import { SiteVisitStatus as SiteVisitStatusType } from '../types/inquiry';

interface SiteVisitStatusProps {
  siteVisit: SiteVisitStatusType;
  onStatusChange?: (status: 'scheduled' | 'done' | 'cancelled') => void;
  onRemarksChange?: (remarks: string) => void;
  isEditable?: boolean;
}

const getUserStatusColor = (status: string): string => {
  switch (status) {
    case 'deal_succeeded':
      return 'text-amber-500'; // Gold for deal success
    case 'deal_lost':
      return 'text-red-500'; // Red for deal lost
    case 'site_visit_scheduled':
    case 'site_visit_done':
      return 'text-green-500'; // Green for site visits/recent
    default:
      return 'text-gray-700'; // Default color
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'done':
      return 'bg-amber-500'; // Golden
    case 'cancelled':
      return 'bg-red-500'; // Red
    case 'scheduled':
      return 'bg-green-500'; // Green
    default:
      return 'bg-gray-500';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'done':
      return 'Visit Completed';
    case 'cancelled':
      return 'Visit Cancelled';
    case 'scheduled':
      return 'Visit Scheduled';
    default:
      return 'Unknown Status';
  }
};

const SiteVisitStatusComponent: React.FC<SiteVisitStatusProps> = ({
  siteVisit,
  onStatusChange,
  onRemarksChange,
  isEditable = false,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [remarks, setRemarks] = React.useState(siteVisit.remarks || '');

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange?.(event.target.value as 'scheduled' | 'done' | 'cancelled');
  };

  const handleRemarksSubmit = () => {
    onRemarksChange?.(remarks);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(siteVisit.status)}`}
          />
          <span className="font-medium">Site Visit Status:</span>
          {isEditable ? (
            <select
              value={siteVisit.status}
              onChange={handleStatusChange}
              className="border rounded px-2 py-1"
            >
              <option value="scheduled">Scheduled</option>
              <option value="done">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : (
            <span className="text-gray-700">{getStatusLabel(siteVisit.status)}</span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {siteVisit.scheduledDate.toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Remarks</h3>
          {isEditable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Edit Remarks
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
              placeholder="Add remarks about the site visit..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleRemarksSubmit}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setRemarks(siteVisit.remarks || '');
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 bg-gray-50 p-2 rounded">
            {siteVisit.remarks || 'No remarks added'}
          </p>
        )}
      </div>

      <div className="mt-4 text-sm">
        <div>Created by: <span className={getUserStatusColor(siteVisit.status)}>{siteVisit.createdBy}</span></div>
        <div>Last updated by: <span className={getUserStatusColor(siteVisit.status)}>{siteVisit.updatedBy}</span></div>
        {siteVisit.actualDate && (
          <div>Actual visit date: {siteVisit.actualDate.toLocaleDateString()}</div>
        )}
      </div>
    </div>
  );
};

export default SiteVisitStatusComponent; 
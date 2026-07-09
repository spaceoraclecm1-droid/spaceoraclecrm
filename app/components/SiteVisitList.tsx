import React from 'react';
import Link from 'next/link';

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

interface SiteVisitListProps {
  siteVisits: SiteVisit[];
  onMarkCompleted: (id: string) => void;
  onCancel: (id: string) => void;
}

const getNameColor = (status: string): string => {
  switch (status) {
    case 'done':
      return 'text-amber-500'; // Gold for completed
    case 'cancelled':
      return 'text-red-500'; // Red for cancelled
    default:
      return 'text-green-500'; // Green for all active/pending visits
  }
};

const SiteVisitList: React.FC<SiteVisitListProps> = ({
  siteVisits,
  onMarkCompleted,
  onCancel,
}) => {
  return (
    <div className="overflow-x-auto">
      <div className="md:hidden text-sm text-gray-500 mb-2">Scroll horizontally to see all data →</div>
      <table className="premium-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Time</th>
            <th className="hidden sm:table-cell">Property</th>
            <th className="hidden md:table-cell">Assigned To</th>
            <th>Status</th>
            <th className="hidden sm:table-cell">Remark</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {siteVisits.map((visit) => (
            <tr key={visit.id}>
              <td data-label="Client">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 items-center justify-center ${getNameColor(visit.status)}`}>
                    {visit.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={`font-medium text-sm sm:text-base ${getNameColor(visit.status)}`}>{visit.clientName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {visit.mobile || 'N/A'}
                    </div>
                  </div>
                </div>
              </td>
              <td data-label="Time">
                <div className="text-xs sm:text-sm">
                  {new Date(visit.scheduledDate).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </td>
              <td className="hidden sm:table-cell" data-label="Property">
                <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-[#1a2e29]/10 dark:bg-[#c69c6d]/10 text-[#1a2e29] dark:text-[#c69c6d]">
                  Site Visit
                </div>
              </td>
              <td className="hidden md:table-cell" data-label="Assigned To">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getNameColor(visit.status)}`}>
                  {visit.assignedTo}
                </div>
              </td>
              <td data-label="Status">
                <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium
                  ${visit.status === 'done' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20' : 
                    visit.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/20' : 
                    'bg-green-100 text-green-800 dark:bg-green-900/20'}`}>
                  {visit.status === 'done' ? 'Completed' :
                    visit.status === 'cancelled' ? 'Cancelled' : 
                    'Scheduled'}
                </div>
              </td>
              <td className="hidden sm:table-cell" data-label="Remark">
                <div className="max-w-[200px]">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {visit.remarks || 'No remarks added'}
                  </div>
                </div>
              </td>
              <td className="text-right" data-label="Actions">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/site-visits/${visit.id}`}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-gray-600 dark:text-gray-400"
                    title="View details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  {visit.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => onMarkCompleted(visit.id)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-amber-600 dark:text-amber-400"
                        title="Mark completed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onCancel(visit.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                        title="Cancel visit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SiteVisitList; 
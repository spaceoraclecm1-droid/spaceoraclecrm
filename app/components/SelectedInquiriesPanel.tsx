'use client';

import React from 'react';
import { useBulkActions } from '../context/BulkActionsContext';
import { Enquiry } from '../utils/bulkActions';

interface SelectedInquiriesPanelProps {
  enquiries: Enquiry[];
  isOpen: boolean;
  onClose: () => void;
}

export default function SelectedInquiriesPanel({
  enquiries,
  isOpen,
  onClose,
}: SelectedInquiriesPanelProps) {
  const { state, toggleSelection, selectAll, clearSelection } = useBulkActions();

  // Get only the selected enquiries with full data
  const selectedEnquiries = enquiries.filter(e => state.selectedIds.has(e.id));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Panel from Right */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform overflow-hidden flex flex-col slide-in-from-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-[#1a2e29] to-[#264a42] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Selected Inquiries
              </h2>
              <p className="text-sm text-[#e5d0b1] mt-1">
                {selectedEnquiries.length} enquir{selectedEnquiries.length !== 1 ? 'ies' : 'y'} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Quick Actions in Header */}
          {selectedEnquiries.length > 0 && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => clearSelection()}
                className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => selectAll(enquiries.map(e => e.id))}
                className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Select All Visible
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedEnquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium mb-1">No inquiries selected</p>
              <p className="text-sm">Click checkboxes to select inquiries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEnquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="premium-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Client Name & ID */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {enquiry['Client Name']}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: #{enquiry.id}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleSelection(enquiry.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                          title="Remove from selection"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {/* Mobile */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mobile</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${enquiry['Mobile']}`}
                              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {enquiry['Mobile']}
                            </a>
                            <a
                              href={`https://wa.me/${enquiry['Mobile'].replace(/[^\d]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                              title="WhatsApp"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                            {enquiry['Email'] || 'N/A'}
                          </p>
                        </div>

                        {/* Project */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Project</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {enquiry['Enquiry For'] || 'N/A'}
                          </p>
                        </div>

                        {/* Area */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Area</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {enquiry['Area'] || 'N/A'}
                          </p>
                        </div>

                        {/* Configuration */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Configuration</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {enquiry['Configuration'] || 'N/A'}
                          </p>
                        </div>

                        {/* Budget */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {enquiry['Budget'] && enquiry['Budget'] !== 'Not specified' 
                              ? `₹${enquiry['Budget']}` 
                              : 'N/A'}
                          </p>
                        </div>

                        {/* Source */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source</p>
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {enquiry['Enquiry Source']}
                          </span>
                        </div>

                        {/* Assigned To */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {enquiry['Assigned To']}
                          </span>
                        </div>

                        {/* Progress */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</p>
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            {enquiry['Enquiry Progress']}
                          </span>
                        </div>

                        {/* Next Follow-up */}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Follow-up</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {enquiry['NFD'] || 'Not scheduled'}
                          </p>
                        </div>
                      </div>

                      {/* Last Remarks */}
                      {enquiry['Last Remarks'] && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Remarks</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                            "{enquiry['Last Remarks']}"
                          </p>
                        </div>
                      )}

                      {/* Action Links */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                        <a
                          href={`/enquiry/${enquiry.id}/edit`}
                          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Edit
                        </a>
                        <a
                          href={`/enquiry/${enquiry.id}/progress`}
                          className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Add Progress
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {selectedEnquiries.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white">
                  Summary
                </p>
                <p className="text-xs mt-1">
                  Status: {selectedEnquiries.filter(e => e['Enquiry Progress'] === 'New').length} New,
                  {' '}{selectedEnquiries.filter(e => e['Enquiry Progress'] === 'In Progress').length} In Progress,
                  {' '}{selectedEnquiries.filter(e => e['Enquiry Progress']?.includes('Site Visit')).length} Site Visit
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#c69c6d] hover:bg-[#b0885c] text-white rounded-lg transition-colors text-sm font-medium"
              >
                Close Panel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

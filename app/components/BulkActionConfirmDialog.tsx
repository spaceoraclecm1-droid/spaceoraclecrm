'use client';

import React, { useState } from 'react';

interface BulkActionConfirmDialogProps {
  isOpen: boolean;
  action: 'delete' | 'deal_lost';
  count: number;
  onConfirm: (remarks?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function BulkActionConfirmDialog({
  isOpen,
  action,
  count,
  onConfirm,
  onCancel,
  isLoading = false,
}: BulkActionConfirmDialogProps) {
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (action === 'deal_lost') {
      onConfirm(remarks || undefined);
    } else {
      onConfirm();
    }
    setRemarks('');
  };

  const handleCancel = () => {
    onCancel();
    setRemarks('');
  };

  const isDelete = action === 'delete';
  const title = isDelete ? 'Delete Enquiries' : 'Mark as Deal Lost';
  const description = isDelete
    ? `You are about to delete ${count} enquir${count !== 1 ? 'ies' : 'y'}. This action can be undone within this session.`
    : `You are about to mark ${count} enquir${count !== 1 ? 'ies' : 'y'} as Deal Lost. This action can be undone within this session.`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full scale-in">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* Count warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                {count} enquir{count !== 1 ? 'ies' : 'y'} will be affected
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>

            {/* Remarks field (for deal_lost only) */}
            {!isDelete && (
              <div>
                <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter optional remarks for this action..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#c69c6d] focus:border-transparent outline-none resize-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Warning message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Tip:</span> You can undo this action using the Undo button.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isDelete
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isDelete ? 'Delete' : 'Mark as Deal Lost'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

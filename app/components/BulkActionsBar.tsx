'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBulkActions } from '../context/BulkActionsContext';
import BulkActionConfirmDialog from './BulkActionConfirmDialog';
import {
  deleteBulkInquiries,
  restoreBulkInquiries,
  markBulkAsDealLost,
  undoDealLost,
  Enquiry,
} from '../utils/bulkActions';

interface BulkActionsBarProps {
  enquiries: Enquiry[];
  onActionComplete: () => void;
  onTogglePanel?: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

export default function BulkActionsBar({
  enquiries,
  onActionComplete,
  onTogglePanel,
}: BulkActionsBarProps) {
  const bulkActions = useBulkActions();

  // Destructure with safe defaults
  const {
    state = { selectedIds: new Set(), history: [], isLoading: false },
    clearSelection = () => {},
    addToHistory = () => {},
    undo = () => {},
    setLoading = () => {},
  } = bulkActions || {};

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'delete' | 'deal_lost';
  }>({
    isOpen: false,
    action: 'delete',
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Keep latest state in a ref for use in async callbacks (handles stale closures)
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Keep latest handlers in refs so toasts always have working callbacks
  const handleUndoRef = useRef<(() => Promise<void>) | null>(null);
  const refreshRef = useRef(onActionComplete);
  refreshRef.current = onActionComplete;

  const selectedIds = Array.from(state.selectedIds || new Set());
  const selectedCount = selectedIds.length;
  const isVisible = selectedCount > 0;
  const historyCount = state.history?.length || 0;

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const id = Date.now().toString() + Math.random();
    const toast: Toast = { id, message, type, actionLabel, onAction };

    setToasts((prev) => [...prev, toast]);

    // Auto-close ONLY for error and info messages (NOT for undo toasts)
    // Undo toasts with actionLabel stay until user clicks Undo or X button
    if (type === 'error' || type === 'info') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
    // Success toasts with action buttons (Undo) stay until manually closed
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setConfirmDialog({ isOpen: false, action: 'delete' });

      const deletedRecords = await deleteBulkInquiries(selectedIds);

      addToHistory({
        action: 'delete',
        inquiryIds: selectedIds,
        timestamp: Date.now(),
        inquiryData: deletedRecords,
      });

      clearSelection();
      if (refreshRef.current) refreshRef.current();

      // Show toast with undo - use ref to ensure fresh handler
      setTimeout(() => {
        showToast(
          `${selectedCount} enquir${selectedCount !== 1 ? 'ies' : 'y'} deleted successfully`,
          'success',
          'Undo',
          () => {
            if (handleUndoRef.current) {
              handleUndoRef.current();
            }
          }
        );
      }, 100);
    } catch (error) {
      console.error('Error deleting inquiries:', error);
      showToast(
        `Failed to delete inquiries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDealLost = async (remarks?: string) => {
    try {
      setLoading(true);
      setConfirmDialog({ isOpen: false, action: 'deal_lost' });

      const { previousData } = await markBulkAsDealLost(selectedIds, remarks);

      addToHistory({
        action: 'deal_lost',
        inquiryIds: selectedIds,
        timestamp: Date.now(),
        inquiryData: previousData,
        remarks,
      });

      clearSelection();
      if (refreshRef.current) refreshRef.current();

      setTimeout(() => {
        showToast(
          `${selectedCount} enquir${selectedCount !== 1 ? 'ies' : 'y'} marked as Deal Lost`,
          'success',
          'Undo',
          () => {
            if (handleUndoRef.current) {
              handleUndoRef.current();
            }
          }
        );
      }, 100);
    } catch (error) {
      console.error('Error marking as deal lost:', error);
      showToast(
        `Failed to mark as Deal Lost: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    try {
      setLoading(true);

      // Always use latest state from ref
      const currentHistory = stateRef.current.history || [];

      if (currentHistory.length === 0) {
        showToast('Nothing to undo', 'info');
        return;
      }

      const lastAction = currentHistory[0];

      if (lastAction.action === 'delete' && lastAction.inquiryData) {
        await restoreBulkInquiries(lastAction.inquiryIds);
        showToast(
          `${lastAction.inquiryIds.length} enquir${lastAction.inquiryIds.length !== 1 ? 'ies' : 'y'} restored`,
          'success'
        );
      } else if (lastAction.action === 'deal_lost' && lastAction.inquiryData) {
        const previousStatuses: Record<number, string> = {};
        lastAction.inquiryData.forEach((record) => {
          previousStatuses[record.id] = record['Enquiry Progress'];
        });

        const progressEntryIds = lastAction.inquiryData.map((record) => record.id);

        await undoDealLost(
          lastAction.inquiryIds,
          previousStatuses,
          progressEntryIds as unknown as string[]
        );

        showToast(
          `${lastAction.inquiryIds.length} enquir${lastAction.inquiryIds.length !== 1 ? 'ies' : 'y'} restored`,
          'success'
        );
      }

      undo();
      if (refreshRef.current) refreshRef.current();
    } catch (error) {
      console.error('Error undoing action:', error);
      showToast(
        `Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Update the ref whenever handleUndo changes
  useEffect(() => {
    handleUndoRef.current = handleUndo;
  }, [handleUndo, state]);

  // Toast portal - renders ALWAYS, even when bar is hidden
  const toastPortal = (
    <div
      className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none"
      style={{ position: 'fixed' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto max-w-sm rounded-lg shadow-2xl p-4 text-white flex items-start justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-green-600'
              : toast.type === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
          }`}
          style={{ animation: 'slideInRight 0.3s ease-out', minWidth: '320px' }}
          role="alert"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                removeToast(toast.id);
              }}
              className="text-sm font-bold hover:underline whitespace-nowrap ml-2 px-3 py-1 bg-white/20 rounded hover:bg-white/30"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white hover:text-gray-100 flex-shrink-0 ml-2"
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  // If bar not visible, only render the toast portal
  if (!isVisible) {
    return toastPortal;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="sticky top-0 z-30 mb-4 bg-gradient-to-r from-[#1a2e29] to-[#264a42] rounded-lg p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Selection Info */}
          <div className="flex items-center gap-4 flex-1">
            <div>
              <p className="text-white font-semibold text-lg">
                {selectedCount} enquir{selectedCount !== 1 ? 'ies' : 'y'} selected
              </p>
              <p className="text-[#e5d0b1] text-xs">
                {historyCount > 0 ? `${historyCount} action${historyCount > 1 ? 's' : ''} available for undo` : 'No undo history'}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {/* View Selected Panel Button */}
            <button
              onClick={() => onTogglePanel?.()}
              disabled={state.isLoading}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="View selected inquiries in panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              View
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => clearSelection()}
              disabled={state.isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Clear selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Clear
            </button>

            {/* Undo Button - ALWAYS VISIBLE if there's history */}
            {historyCount > 0 && (
              <button
                onClick={handleUndo}
                disabled={state.isLoading}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                title="Undo last action"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999a11.954 11.954 0 010 10.002 8.5 8.5 0 1113.652-5.355"
                    clipRule="evenodd"
                  />
                </svg>
                Undo
              </button>
            )}

            {/* Deal Lost Button */}
            <button
              onClick={() => setConfirmDialog({ isOpen: true, action: 'deal_lost' })}
              disabled={state.isLoading}
              className="px-3 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Mark selected as Deal Lost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Deal Lost
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setConfirmDialog({ isOpen: true, action: 'delete' })}
              disabled={state.isLoading}
              className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Delete selected"
            >
              {state.isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <BulkActionConfirmDialog
        isOpen={confirmDialog.isOpen}
        action={confirmDialog.action}
        count={selectedCount}
        onConfirm={
          confirmDialog.action === 'delete' ? handleDelete : handleDealLost
        }
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isLoading={state.isLoading}
      />

      {/* Toast Portal */}
      {toastPortal}
    </>
  );
}

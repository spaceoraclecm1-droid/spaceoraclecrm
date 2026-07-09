'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Enquiry {
  id: number;
  'Client Name': string;
  'Mobile': string;
  'Email': string;
  'Enquiry For': string;
  'Property Type': string;
  'Assigned To': string;
  'Created Date': string;
  'Enquiry Progress': string;
  'Budget': string;
  'NFD': string;
  'Remarks': string;
  'Favourite': string;
  'Near to Win': string;
  'Enquiry Source': string;
  'Assigned By': string;
  'Area': string;
  'Configuration': string;
  'Last Remarks': string;
  'is_deleted'?: boolean;
}

export interface BulkActionHistoryItem {
  action: 'delete' | 'deal_lost';
  inquiryIds: number[];
  timestamp: number;
  inquiryData?: Enquiry[]; // For undo - store full record data
  remarks?: string; // For deal_lost action
}

interface BulkActionsState {
  selectedIds: Set<number>;
  history: BulkActionHistoryItem[];
  isLoading: boolean;
  message?: string;
  messageType?: 'success' | 'error' | 'info';
}

type BulkActionsAction =
  | { type: 'TOGGLE_SELECTION'; id: number }
  | { type: 'SELECT_ALL'; ids: number[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_HISTORY'; item: BulkActionHistoryItem }
  | { type: 'UNDO' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_MESSAGE'; message: string; messageType: 'success' | 'error' | 'info' }
  | { type: 'CLEAR_MESSAGE' };

const initialState: BulkActionsState = {
  selectedIds: new Set(),
  history: [],
  isLoading: false,
};

function bulkActionsReducer(state: BulkActionsState, action: BulkActionsAction): BulkActionsState {
  switch (action.type) {
    case 'TOGGLE_SELECTION': {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(action.id)) {
        newSelectedIds.delete(action.id);
      } else {
        newSelectedIds.add(action.id);
      }
      return { ...state, selectedIds: newSelectedIds };
    }

    case 'SELECT_ALL': {
      return { ...state, selectedIds: new Set(action.ids) };
    }

    case 'CLEAR_SELECTION': {
      return { ...state, selectedIds: new Set() };
    }

    case 'ADD_HISTORY': {
      const newHistory = [action.item, ...state.history];
      // Keep only last 10 actions to avoid memory bloat
      if (newHistory.length > 10) {
        newHistory.pop();
      }
      return { ...state, history: newHistory };
    }

    case 'UNDO': {
      if (state.history.length === 0) {
        return state;
      }
      const newHistory = [...state.history];
      newHistory.shift(); // Remove the most recent action
      return { ...state, history: newHistory };
    }

    case 'SET_LOADING': {
      return { ...state, isLoading: action.isLoading };
    }

    case 'SET_MESSAGE': {
      return {
        ...state,
        message: action.message,
        messageType: action.messageType,
      };
    }

    case 'CLEAR_MESSAGE': {
      return { ...state, message: undefined, messageType: undefined };
    }

    default:
      return state;
  }
}

interface BulkActionsContextType {
  state: BulkActionsState;
  toggleSelection: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  addToHistory: (item: BulkActionHistoryItem) => void;
  undo: () => void;
  canUndo: boolean;
  setLoading: (isLoading: boolean) => void;
  setMessage: (message: string, type: 'success' | 'error' | 'info') => void;
  clearMessage: () => void;
}

const BulkActionsContext = createContext<BulkActionsContextType | undefined>(undefined);

export function BulkActionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bulkActionsReducer, initialState);

  const toggleSelection = (id: number) => {
    dispatch({ type: 'TOGGLE_SELECTION', id });
  };

  const selectAll = (ids: number[]) => {
    dispatch({ type: 'SELECT_ALL', ids });
  };

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  const addToHistory = (item: BulkActionHistoryItem) => {
    dispatch({ type: 'ADD_HISTORY', item });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  const setLoading = (isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', isLoading });
  };

  const setMessage = (message: string, type: 'success' | 'error' | 'info') => {
    dispatch({ type: 'SET_MESSAGE', message, messageType: type });
  };

  const clearMessage = () => {
    dispatch({ type: 'CLEAR_MESSAGE' });
  };

  const value: BulkActionsContextType = {
    state,
    toggleSelection,
    selectAll,
    clearSelection,
    addToHistory,
    undo,
    canUndo: state.history.length > 0,
    setLoading,
    setMessage,
    clearMessage,
  };

  return (
    <BulkActionsContext.Provider value={value}>
      {children}
    </BulkActionsContext.Provider>
  );
}

export function useBulkActions() {
  const context = useContext(BulkActionsContext);
  if (context === undefined) {
    throw new Error('useBulkActions must be used within BulkActionsProvider');
  }
  return context;
}

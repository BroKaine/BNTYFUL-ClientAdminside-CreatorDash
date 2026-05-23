import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { AppState, AppAction, Influencer, Filters, SortOption } from '@/types/influencer';
import { initialState } from '@/types/influencer';
import { appReducer } from './AppReducer';
import { generateDatasetHash } from '@/utils/formatters';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setFile: (file: File | null) => void;
  setRawData: (data: Influencer[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilteredData: (data: Influencer[]) => void;
  toggleExpand: (id: string) => void;
  toggleApprove: (id: string) => void;
  setApproved: (ids: Set<string>) => void;
  setFilter: (key: keyof Filters, value: any) => void;
  clearFilters: () => void;
  setSort: (sort: SortOption) => void;
  resetState: () => void;
  persistApprovals: (influencers: Influencer[], approvedIds: Set<string>) => void;
  loadApprovals: (influencers: Influencer[]) => Set<string>;
  exportApprovedCSV: (influencers: Influencer[], approvedIds: Set<string>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setFile = useCallback((file: File | null) => dispatch({ type: 'SET_FILE', payload: file }), []);
  const setRawData = useCallback((data: Influencer[]) => dispatch({ type: 'SET_RAW_DATA', payload: data }), []);
  const setLoading = useCallback((loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }), []);
  const setError = useCallback((error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }), []);
  const setFilteredData = useCallback((data: Influencer[]) => dispatch({ type: 'SET_FILTERED_DATA', payload: data }), []);
  const toggleExpand = useCallback((id: string) => dispatch({ type: 'TOGGLE_EXPAND', payload: id }), []);
  const toggleApprove = useCallback((id: string) => dispatch({ type: 'TOGGLE_APPROVE', payload: id }), []);
  const setApproved = useCallback((ids: Set<string>) => dispatch({ type: 'SET_APPROVED', payload: ids }), []);
  const setFilter = useCallback((key: keyof Filters, value: any) => dispatch({ type: 'SET_FILTER', payload: { key, value } }), []);
  const clearFilters = useCallback(() => dispatch({ type: 'CLEAR_FILTERS' }), []);
  const setSort = useCallback((sort: SortOption) => dispatch({ type: 'SET_SORT', payload: sort }), []);
  const resetState = useCallback(() => dispatch({ type: 'RESET_STATE' }), []);

  const persistApprovals = useCallback((influencers: Influencer[], approvedIds: Set<string>) => {
    const hash = generateDatasetHash(influencers);
    const approvals = Array.from(approvedIds);
    localStorage.setItem(hash, JSON.stringify(approvals));
  }, []);

  const loadApprovals = useCallback((influencers: Influencer[]): Set<string> => {
    const hash = generateDatasetHash(influencers);
    const stored = localStorage.getItem(hash);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set();
      }
    }
    return new Set();
  }, []);

  const exportApprovedCSV = useCallback((influencers: Influencer[], approvedIds: Set<string>) => {
    const approved = influencers.filter(i => approvedIds.has(i.id));
    if (approved.length === 0) return;

    const headers = ['Name', 'Tier', 'Total Score', 'Audience Size', 'Email', 'Primary Platform', 'Category', 'Subcategory'];
    const rows = approved.map(i => [
      i.creatorName,
      i.tier,
      i.totalScore.toString(),
      i.audienceSize.toString(),
      i.email,
      i.primaryPlatform,
      i.category,
      i.subcategory,
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'approved_influencers.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setFile,
        setRawData,
        setLoading,
        setError,
        setFilteredData,
        toggleExpand,
        toggleApprove,
        setApproved,
        setFilter,
        clearFilters,
        setSort,
        resetState,
        persistApprovals,
        loadApprovals,
        exportApprovedCSV,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

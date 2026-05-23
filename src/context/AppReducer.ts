import type { AppState, AppAction } from '@/types/influencer';
import { initialState, initialFilters } from '@/types/influencer';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, file: action.payload };
    case 'SET_RAW_DATA':
      return { ...state, rawData: action.payload, filteredData: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_FILTERED_DATA':
      return { ...state, filteredData: action.payload };
    case 'TOGGLE_EXPAND': {
      const newExpanded = new Set(state.expandedCards);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedCards: newExpanded };
    }
    case 'TOGGLE_APPROVE': {
      const newApproved = new Set(state.approvedIds);
      if (newApproved.has(action.payload)) {
        newApproved.delete(action.payload);
      } else {
        newApproved.add(action.payload);
      }
      return { ...state, approvedIds: newApproved };
    }
    case 'SET_APPROVED':
      return { ...state, approvedIds: action.payload };
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value },
      };
    case 'CLEAR_FILTERS':
      return { ...state, filters: { ...initialFilters } };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
}

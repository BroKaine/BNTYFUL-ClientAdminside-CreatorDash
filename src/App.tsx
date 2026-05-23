import { useEffect, useMemo } from 'react';
import { Bell, Download, FileSpreadsheet, Loader2, Database } from 'lucide-react';
import { AppProvider, useApp } from '@/context/AppContext';
import { useFilteredAndSortedData } from '@/hooks/useFilters';
import { extractFilterOptions } from '@/utils/normalizer';
import UploadZone from '@/components/UploadZone';
import FilterBar from '@/components/FilterBar';
import StatsRow from '@/components/StatsRow';
import InfluencerCard from '@/components/InfluencerCard';
import './App.css';

function DashboardContent() {
  const { state, toggleExpand, toggleApprove, persistApprovals, exportApprovedCSV, setFilteredData } = useApp();
  const { rawData, isLoading, error, expandedCards, approvedIds, filters, sortBy } = state;

  const filteredData = useFilteredAndSortedData(rawData, filters, sortBy, approvedIds);

  useEffect(() => {
    setFilteredData(filteredData);
  }, [filteredData, setFilteredData]);

  useEffect(() => {
    if (rawData.length > 0) {
      persistApprovals(rawData, approvedIds);
    }
  }, [approvedIds, rawData, persistApprovals]);

  const filterOptions = useMemo(() => {
    if (rawData.length === 0) {
      return { tiers: [], categories: [], subcategories: [], platforms: [], regions: [], languages: [] };
    }
    return extractFilterOptions(rawData);
  }, [rawData]);

  const hasData = rawData.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-[#0A1628] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <Database size={18} className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base sm:text-lg tracking-tight">Influencer Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasData && (
            <button
              onClick={() => exportApprovedCSV(rawData, approvedIds)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-teal-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export Approved</span>
              <span className="sm:hidden">Export</span>
            </button>
          )}
          <div className="relative">
            <Bell size={20} className="text-gray-400 cursor-pointer hover:text-gray-300 transition-colors" />
            {approvedIds.size > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {approvedIds.size}
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-300 cursor-pointer">
            U
          </div>
        </div>
      </header>

      {/* Subheader */}
      {hasData && !isLoading && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Review and approve creator partnerships
          </p>
          <p className="text-sm text-emerald-600 font-semibold">
            Approved: {approvedIds.size} of {filteredData.length}
            {filteredData.length < rawData.length && (
              <span className="text-gray-400 font-normal text-xs ml-1">
                (filtered from {rawData.length})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-500 font-bold">
            !
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-600 truncate">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="text-teal-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Processing your data...</p>
          <p className="text-gray-400 text-sm mt-1">This may take a moment for large files</p>
        </div>
      )}

      {/* Upload State */}
      {!isLoading && !hasData && !error && <UploadZone />}

      {/* Dashboard */}
      {hasData && !isLoading && (
        <>
          <FilterBar influencers={filteredData} filterOptions={filterOptions} />
          <StatsRow influencers={filteredData} approvedIds={approvedIds} />

          {/* Influencer Cards - Single Column */}
          <div className="px-4 sm:px-6 pb-20 max-w-[1400px] mx-auto">
            {filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FileSpreadsheet size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium text-lg">No influencers match your filters</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filter criteria</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {filteredData.map(influencer => (
                  <InfluencerCard
                    key={influencer.id}
                    influencer={influencer}
                    expanded={expandedCards.has(influencer.id)}
                    approved={approvedIds.has(influencer.id)}
                    onToggleExpand={toggleExpand}
                    onToggleApprove={toggleApprove}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

export default App;

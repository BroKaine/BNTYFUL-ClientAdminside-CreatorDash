import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { parseXlsx } from '@/utils/normalizer';
import { useApp } from '@/context/AppContext';

export default function UploadZone() {
  const { setFile, setRawData, setLoading, setError, setFilteredData, loadApprovals, setApproved } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls') && !ext.endsWith('.csv')) {
      setError('Please upload a valid .xlsx, .xls, or .csv file.');
      return;
    }

    setFile(file);
    setLoading(true);
    setError(null);

    try {
      const influencers = await parseXlsx(file);
      const approvals = loadApprovals(influencers);
      setApproved(approvals);
      setRawData(influencers);
      setFilteredData(influencers);
    } catch (err: any) {
      setError(err.message || 'Failed to parse the file.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [setFile, setRawData, setLoading, setError, setFilteredData, loadApprovals, setApproved]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  }, [handleFile]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-xl h-64 sm:h-72 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all duration-200 cursor-pointer mx-4 ${
          isDragOver
            ? 'border-teal-500 bg-teal-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-colors ${
          isDragOver ? 'bg-teal-100' : 'bg-gray-100'
        }`}>
          {isDragOver ? (
            <Upload size={24} className="text-teal-600 sm:hidden" />
          ) : (
            <FileSpreadsheet size={24} className="text-gray-400 sm:hidden" />
          )}
          {isDragOver ? (
            <Upload size={28} className="text-teal-600 hidden sm:block" />
          ) : (
            <FileSpreadsheet size={28} className="text-gray-400 hidden sm:block" />
          )}
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-medium text-gray-700">
            Drop your XLSX or CSV file here
          </p>
          <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          <p className="text-[11px] text-gray-400 mt-3">
            Supports .xlsx, .xls, .csv files
          </p>
        </div>
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}

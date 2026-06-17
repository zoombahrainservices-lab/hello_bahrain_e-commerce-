'use client';

import MediaFilters from './MediaFilters';
import MediaSortSelect from './MediaSortSelect';
import { MediaFolder } from '@/lib/media/types';

interface MediaToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sort: string;
  onSortChange: (sort: any) => void;
  folders: MediaFolder[];
  selectedFolderId: string | null;
  selectedMimeType: string | null;
  onFolderChange: (id: string | null) => void;
  onMimeTypeChange: (type: string | null) => void;
  onUploadClick: () => void;
  total?: number;
  productGroupsMode?: boolean;
}

export default function MediaToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
  folders,
  selectedFolderId,
  selectedMimeType,
  onFolderChange,
  onMimeTypeChange,
  onUploadClick,
  total,
  productGroupsMode = false,
}: MediaToolbarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white flex-wrap">
      <div className="relative flex-1 min-w-48">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={productGroupsMode ? 'Search products...' : 'Search media...'}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {total !== undefined && (
        <span className="text-sm text-gray-500 hidden sm:block">
          {total} {productGroupsMode ? 'product' : 'file'}{total !== 1 ? 's' : ''}
        </span>
      )}

      {!productGroupsMode && (
        <MediaFilters
          folders={folders}
          selectedFolderId={selectedFolderId}
          selectedMimeType={selectedMimeType}
          onFolderChange={onFolderChange}
          onMimeTypeChange={onMimeTypeChange}
        />
      )}

      <MediaSortSelect value={sort as any} onChange={onSortChange} productGroupsMode={productGroupsMode} />

      {!productGroupsMode && (
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Grid view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {!productGroupsMode && (
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload
        </button>
      )}
    </div>
  );
}

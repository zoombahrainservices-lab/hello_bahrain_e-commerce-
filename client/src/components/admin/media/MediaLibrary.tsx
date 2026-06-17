'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  MediaItemWithVariantsAndUsageCount,
  MediaItemWithVariants,
  MediaFolder,
  MediaListResponse,
} from '@/lib/media/types';
import MediaToolbar from './MediaToolbar';
import MediaFolderSidebar from './MediaFolderSidebar';
import MediaGrid from './MediaGrid';
import MediaList from './MediaList';
import MediaDetailsPanel from './MediaDetailsPanel';
import MediaUploadDropzone, { PendingFile } from './MediaUploadDropzone';
import MediaUploadQueue from './MediaUploadQueue';
import MediaTrashView from './MediaTrashView';
import ProductMediaFolderView from './ProductMediaFolderView';
import { DEFAULT_FOLDER_SLUGS } from '@/lib/media/constants';

interface MediaLibraryProps {
  /** When true, the library operates in picker mode — clicking an item calls onSelect */
  selectMode?: boolean;
  onSelect?: (item: MediaItemWithVariants) => void;
  /** Multi-select picker mode */
  multiSelect?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (item: MediaItemWithVariants) => void;
  /** Pre-select a folder */
  defaultFolderId?: string | null;
  /** Hide the details panel in picker mode */
  hideDetails?: boolean;
}

export default function MediaLibrary({
  selectMode,
  onSelect,
  multiSelect,
  selectedIds = [],
  onToggleSelect,
  defaultFolderId,
  hideDetails,
}: MediaLibraryProps) {
  const { user } = useAuth();

  // ─── Filter / display state ───────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'file_size_asc' | 'file_size_desc' | 'name_asc' | 'name_desc'>('newest');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId ?? null);
  const [selectedMimeType, setSelectedMimeType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 48;

  // ─── Data state ───────────────────────────────────────────
  const [items, setItems] = useState<MediaItemWithVariantsAndUsageCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<MediaFolder[]>([]);

  // ─── Selected item (details panel) ───────────────────────
  const [selectedItem, setSelectedItem] = useState<MediaItemWithVariantsAndUsageCount | null>(null);

  // ─── Upload state ──────────────────────────────────────
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadMode, setUploadMode] = useState<'normal' | 'bulk'>('normal');

  // ─── Trash state ───────────────────────────────────────
  const [showingTrash, setShowingTrash] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [productGroupTotal, setProductGroupTotal] = useState(0);

  const productsFolderId = folders.find((f) => f.slug === DEFAULT_FOLDER_SLUGS.products)?.id ?? null;
  const isProductsFolder = !showingTrash && selectedFolderId === productsFolderId && productsFolderId !== null;

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [selectedFolderId, selectedMimeType, sort]);

  // Load folders once
  useEffect(() => {
    api.get('/api/admin/media?resource=folders').then((res) => {
      setFolders(res.data);
    }).catch(() => {});
  }, []);

  // Load trash count
  const refreshTrashCount = useCallback(() => {
    api.get('/api/admin/media/trash?countOnly=true')
      .then((res) => setTrashCount(res.data.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => { refreshTrashCount(); }, [refreshTrashCount]);

  // Load media
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (selectedFolderId) params.set('folderId', selectedFolderId);
      if (selectedMimeType) params.set('mimeType', selectedMimeType);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));

      const res = await api.get<MediaListResponse>(`/api/admin/media?${params}`);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedFolderId, selectedMimeType, sort, page]);

  useEffect(() => { if (!isProductsFolder) fetchMedia(); }, [fetchMedia, isProductsFolder]);

  // Handlers
  const handleItemClick = (item: MediaItemWithVariantsAndUsageCount) => {
    if (multiSelect && onToggleSelect) {
      onToggleSelect(item);
      return;
    }
    // Always highlight the clicked item so the grid shows a selection ring
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
    if (selectMode && onSelect) {
      onSelect(item);
    }
  };

  const handleUploaded = (_uploaded: MediaItemWithVariants) => {
    // Refresh the list to show the new item
    fetchMedia();
  };

  const handleItemUpdate = (updated: MediaItemWithVariants) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === updated.id ? { ...updated, usageCount: i.usageCount } : i,
      ),
    );
    setSelectedItem((prev) => (prev && prev.id === updated.id ? { ...updated, usageCount: prev.usageCount } : prev));
  };

  const handleItemDelete = () => {
    setSelectedItem(null);
    fetchMedia();
    refreshTrashCount();
  };

  const totalPages = Math.ceil(total / LIMIT);

  // Get auth token from localStorage (same source as axios interceptor)
  const [authToken, setAuthToken] = useState<string | null>(null);
  useEffect(() => {
    setAuthToken(localStorage.getItem('token'));
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <MediaToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sort={sort}
        onSortChange={setSort}
        folders={folders}
        selectedFolderId={selectedFolderId}
        selectedMimeType={selectedMimeType}
        onFolderChange={setSelectedFolderId}
        onMimeTypeChange={setSelectedMimeType}
        onUploadClick={() => setShowUploadZone((v) => !v)}
        total={isProductsFolder ? productGroupTotal : total}
        productGroupsMode={isProductsFolder}
      />

      {/* Upload zone */}
      {showUploadZone && !isProductsFolder && (
        <div className="px-4 pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadMode('normal');
                setPendingFiles([]);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                uploadMode === 'normal'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('bulk');
                setPendingFiles([]);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                uploadMode === 'bulk'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Bulk Upload
            </button>
          </div>

          <MediaUploadDropzone
            onFilesSelected={(files) =>
              setPendingFiles((prev) => {
                if (uploadMode === 'normal') {
                  const merged = [...prev, ...files];
                  return merged.slice(0, 10);
                }
                const merged = [...prev, ...files];
                return merged.slice(0, 50);
              })
            }
            maxFiles={uploadMode === 'normal' ? 10 : 50}
            label={
              uploadMode === 'normal'
                ? 'Drag & drop or click to upload image'
                : 'Drag & drop or click to upload images'
            }
            helperText={
              uploadMode === 'normal'
                ? 'JPG, PNG, WebP, SVG'
                : 'JPG, PNG, WebP, SVG'
            }
          />
          {pendingFiles.length > 0 && (
            <MediaUploadQueue
              pending={pendingFiles}
              folderId={selectedFolderId}
              onUploaded={handleUploaded}
              onClearCompleted={() => setPendingFiles([])}
              authToken={authToken}
            />
          )}
        </div>
      )}

      {/* Body: sidebar + content + details */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Folder sidebar */}
        {!selectMode && (
          <MediaFolderSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={(id) => { setSelectedFolderId(id); setShowingTrash(false); }}
            showingTrash={showingTrash}
            onTrashClick={() => { setShowingTrash(true); setSelectedItem(null); setShowUploadZone(false); }}
            trashCount={trashCount}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {showingTrash ? (
            <MediaTrashView
              onRestored={() => { refreshTrashCount(); fetchMedia(); }}
            />
          ) : isProductsFolder ? (
            <ProductMediaFolderView
              searchQuery={debouncedQuery}
              sort={sort}
              onTotalChange={setProductGroupTotal}
            />
          ) : viewMode === 'grid' ? (
            <MediaGrid
              items={items}
              selectedId={selectedItem?.id ?? null}
              selectedIds={selectedIds}
              selectable={selectMode || multiSelect}
              onSelect={handleItemClick}
              loading={loading}
            />
          ) : (
            <MediaList
              items={items}
              selectedId={selectedItem?.id ?? null}
              selectedIds={selectedIds}
              onSelect={handleItemClick}
              loading={loading}
            />
          )}

          {/* Pagination */}
          {!isProductsFolder && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Details panel */}
        {!hideDetails && !showingTrash && !isProductsFolder && selectedItem && (
          <MediaDetailsPanel
            item={selectedItem}
            folders={folders}
            onUpdate={handleItemUpdate}
            onDelete={handleItemDelete}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { MediaItemWithVariantsAndUsageCount } from '@/lib/media/types';
import { formatBytes, getAdminDisplayFileSize } from '@/lib/media/display-utils';

interface MediaListProps {
  items: MediaItemWithVariantsAndUsageCount[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (item: MediaItemWithVariantsAndUsageCount) => void;
  loading?: boolean;
}

function getThumbnailUrl(item: MediaItemWithVariantsAndUsageCount): string | null {
  const thumb = item.variants.find((v) => v.variant === 'thumb');
  if (thumb) return thumb.publicUrl;
  const svgPreview = item.variants.find((v) => v.variant === 'svg_preview');
  if (svgPreview) return svgPreview.publicUrl;
  return item.publicUrl;
}

export default function MediaList({ items, selectedId, selectedIds = [], onSelect, loading }: MediaListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No media found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item) => {
        const thumbnailUrl = getThumbnailUrl(item);
        const displaySize = getAdminDisplayFileSize(item);
        const isSelected = selectedIds.includes(item.id) || selectedId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
            }`}
          >
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.originalFileName}</p>
              <p className="text-xs text-gray-500">
                {displaySize != null ? formatBytes(displaySize) : '—'}
                {item.variants.some((v) => v.variant === 'card') && (
                  <span className="text-green-600"> · optimized</span>
                )}
                {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                {' · '}
                {item.mimeType.replace('image/', '').toUpperCase()}
              </p>
            </div>

            {/* Usage */}
            {item.usageCount > 0 && (
              <span className="text-xs text-gray-500 shrink-0">
                {item.usageCount} use{item.usageCount !== 1 ? 's' : ''}
              </span>
            )}

            {/* Date */}
            <span className="text-xs text-gray-400 shrink-0 hidden md:block">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

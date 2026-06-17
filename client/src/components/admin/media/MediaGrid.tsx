'use client';

import { MediaItemWithVariantsAndUsageCount } from '@/lib/media/types';
import MediaCard from './MediaCard';

interface MediaGridProps {
  items: MediaItemWithVariantsAndUsageCount[];
  selectedId: string | null;
  selectedIds?: string[];
  selectable?: boolean;
  onSelect: (item: MediaItemWithVariantsAndUsageCount) => void;
  loading?: boolean;
}

export default function MediaGrid({
  items,
  selectedId,
  selectedIds = [],
  selectable,
  onSelect,
  loading,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border-2 border-gray-100 animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-2 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">No media found</p>
        <p className="text-sm mt-1">Upload your first image to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          selected={selectedIds.includes(item.id) || selectedId === item.id}
          selectable={selectable}
          onClick={() => onSelect(item)}
        />
      ))}
    </div>
  );
}

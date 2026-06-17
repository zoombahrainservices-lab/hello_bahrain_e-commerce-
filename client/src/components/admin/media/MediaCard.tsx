'use client';

import { MediaItemWithVariantsAndUsageCount } from '@/lib/media/types';
import { formatBytes, getAdminDisplayFileSize, getOriginalFileSize } from '@/lib/media/display-utils';

interface MediaCardProps {
  item: MediaItemWithVariantsAndUsageCount;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
}

function getThumbnailUrl(item: MediaItemWithVariantsAndUsageCount): string | null {
  const thumb = item.variants.find((v) => v.variant === 'thumb');
  if (thumb) return thumb.publicUrl;
  const svgPreview = item.variants.find((v) => v.variant === 'svg_preview');
  if (svgPreview) return svgPreview.publicUrl;
  if (item.mimeType === 'image/svg+xml') return item.publicUrl;
  return item.publicUrl;
}

export default function MediaCard({ item, selected, selectable, onClick }: MediaCardProps) {
  const thumbnailUrl = getThumbnailUrl(item);
  const isSvg = item.mimeType === 'image/svg+xml';
  const displaySize = getAdminDisplayFileSize(item);
  const originalSize = getOriginalFileSize(item);
  const sizeTitle =
    displaySize && originalSize && displaySize < originalSize
      ? `Optimized card size: ${formatBytes(displaySize)} · Archive: ${formatBytes(originalSize)}`
      : undefined;

  return (
    <div
      onClick={onClick}
      className={`
        group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-white
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}
        ${selectable ? 'hover:shadow-md' : ''}
      `}
    >
      {/* Thumbnail */}
      <div className="aspect-square relative bg-gray-50 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.altText ?? item.originalFileName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' font-size='12' fill='%239ca3af' text-anchor='middle'%3ENo preview%3C/text%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* SVG badge */}
        {isSvg && (
          <span className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            SVG
          </span>
        )}

        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Usage badge */}
        {item.usageCount > 0 && (
          <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
            {item.usageCount} use{item.usageCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p
          className="text-xs font-medium text-gray-800 truncate"
          title={item.title ?? item.originalFileName}
        >
          {item.title ?? item.originalFileName}
        </p>
        {displaySize != null && (
          <p className="text-xs text-gray-500 mt-0.5" title={sizeTitle}>
            {formatBytes(displaySize)}
            {item.variants.some((v) => v.variant === 'card') && (
              <span className="text-green-600"> · optimized</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

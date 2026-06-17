'use client';

import Link from 'next/link';
import { ProductMediaGroupSummary } from '@/lib/media/product-media-groups';

interface ProductMediaGroupCardProps {
  group: ProductMediaGroupSummary;
  selected?: boolean;
  onClick: () => void;
}

export default function ProductMediaGroupCard({
  group,
  selected,
  onClick,
}: ProductMediaGroupCardProps) {
  const extraCount = Math.max(0, group.imageCount - 1);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group text-left w-full rounded-lg overflow-hidden border-2 transition-all bg-white
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}
      `}
    >
      <div className="aspect-square relative bg-gray-50 overflow-hidden">
        {group.mainThumbUrl ? (
          <img
            src={group.mainThumbUrl}
            alt={group.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {extraCount > 0 && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
            +{extraCount} more
          </span>
        )}

        <span className="absolute top-1.5 left-1.5 bg-primary-600 text-white text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded">
          Product
        </span>
      </div>

      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-800 truncate" title={group.productName}>
          {group.productName}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {group.imageCount} image{group.imageCount !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  );
}

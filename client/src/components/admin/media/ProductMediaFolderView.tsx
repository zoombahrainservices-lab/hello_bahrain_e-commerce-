'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ProductMedia } from '@/lib/media/types';
import { ProductMediaGroupSummary } from '@/lib/media/product-media-groups';
import ProductMediaGroupCard from './ProductMediaGroupCard';
import ProductMediaGallery, { sortProductMediaItems } from '@/components/admin/products/ProductMediaGallery';

interface ProductMediaFolderViewProps {
  searchQuery: string;
  sort: string;
  onTotalChange?: (total: number) => void;
}

export default function ProductMediaFolderView({
  searchQuery,
  sort,
  onTotalChange,
}: ProductMediaFolderViewProps) {
  const [groups, setGroups] = useState<ProductMediaGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ProductMediaGroupSummary | null>(null);
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const LIMIT = 48;

  useEffect(() => {
    setAuthToken(localStorage.getItem('token'));
  }, []);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      params.set('sort', sort === 'name_asc' || sort === 'name_desc' ? sort : 'newest');
      params.set('page', String(page));
      params.set('limit', String(LIMIT));

      const res = await api.get(`/api/admin/media/product-groups?${params}`);
      setGroups(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
      onTotalChange?.(res.data.total ?? 0);
    } catch (err) {
      console.error('Failed to load product groups:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sort, page, onTotalChange]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sort]);

  const loadProductMedia = async (productId: string) => {
    setMediaLoading(true);
    try {
      const res = await api.get<ProductMedia[]>(`/api/admin/products/${productId}/media`);
      setProductMedia(sortProductMediaItems(res.data));
    } catch {
      setProductMedia([]);
    } finally {
      setMediaLoading(false);
    }
  };

  const handleSelectGroup = (group: ProductMediaGroupSummary) => {
    setSelected(group);
    loadProductMedia(group.productId);
  };

  const handleMediaChange = (items: ProductMedia[]) => {
    setProductMedia(sortProductMediaItems(items));
    const count = items.length;
    setGroups((prev) =>
      prev.map((g) =>
        g.productId === selected?.productId
          ? {
              ...g,
              imageCount: count,
              mainThumbUrl:
                items[0]?.media?.variants.find((v) => v.variant === 'thumb')?.publicUrl ??
                items[0]?.media?.publicUrl ??
                g.mainThumbUrl,
            }
          : g,
      ),
    );
    setSelected((prev) => (prev ? { ...prev, imageCount: count } : null));
  };

  const totalPages = Math.ceil(total / LIMIT);

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

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 px-4">
        <p className="text-lg font-medium">No products with images</p>
        <p className="text-sm mt-1 text-center">
          Product images appear here once they are linked to a product.
        </p>
        <Link
          href="/admin/products"
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Go to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
          {groups.map((group) => (
            <ProductMediaGroupCard
              key={group.productId}
              group={group}
              selected={selected?.productId === group.productId}
              onClick={() => handleSelectGroup(group)}
            />
          ))}
        </div>

        {totalPages > 1 && (
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

      {selected && (
        <div className="w-full max-w-md shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{selected.productName}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selected.imageCount} image{selected.imageCount !== 1 ? 's' : ''} · click images below to manage
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            <Link
              href={`/admin/products/${selected.productId}`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Edit product details
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            {mediaLoading ? (
              <div className="space-y-3">
                <div className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <ProductMediaGallery
                productId={selected.productId}
                items={productMedia}
                onItemsChange={handleMediaChange}
                authToken={authToken}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

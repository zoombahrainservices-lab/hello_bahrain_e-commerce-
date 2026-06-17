'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProductMedia } from '@/lib/media/types';
import ProductMediaGallery, { sortProductMediaItems } from './ProductMediaGallery';

interface ProductMediaSectionProps {
  productId: string;
  authToken: string | null;
}

export default function ProductMediaSection({ productId, authToken }: ProductMediaSectionProps) {
  const [items, setItems] = useState<ProductMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    fetchProductMedia();
  }, [productId]);

  const fetchProductMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<ProductMedia[]>(`/api/admin/products/${productId}/media`);
      setItems(sortProductMediaItems(res.data));
    } catch {
      setError('Failed to load product media.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
        {error}{' '}
        <button onClick={fetchProductMedia} className="underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <ProductMediaGallery
      productId={productId}
      items={items}
      onItemsChange={setItems}
      authToken={authToken}
    />
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Banner } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import BannerCarousel from '@/components/BannerCarousel';

const categories = ['All', 'T-Shirts', 'Hoodies', 'Bags', 'Bottles', 'Caps', 'Accessories', 'Souvenirs', 'Luxury Items'];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
];

export default function MerchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const category = searchParams?.get('category') || 'All';
  const sort = searchParams?.get('sort') || 'newest';
  const search = searchParams?.get('search') || '';

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [category, sort, search, page]);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/banners/active');
      console.log('Banners fetched:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setBanners(response.data);
      } else {
        setBanners([]);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 12,
        sort,
      };

      if (category !== 'All') {
        params.category = category;
      }

      if (search) {
        params.search = search;
      }

      const response = await api.get('/api/products', { params });
      setProducts(response.data.items);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setPage(1); // Reset to page 1 when filtering
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Banners Carousel */}
      {banners && banners.length > 0 && <BannerCarousel banners={banners} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => updateParams('category', cat === 'All' ? '' : cat)}
                className={`px-4 py-2 rounded-lg transition ${
                  category === cat || (cat === 'All' && !category)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateParams('search', e.currentTarget.value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => updateParams('sort', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}


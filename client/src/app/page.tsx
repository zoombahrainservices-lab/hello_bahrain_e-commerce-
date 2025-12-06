'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Banner } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import BannerCarousel from '@/components/BannerCarousel';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
];

function MerchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Local search term for live updates

  const category = searchParams?.get('category') || 'All';
  const sort = searchParams?.get('sort') || 'newest';
  const search = searchParams?.get('search') || ''; // URL search param (for bookmarking/sharing)

  // Sync search input with URL param on initial load
  useEffect(() => {
    if (search) {
      setSearchInput(search);
      setSearchTerm(search);
    }
  }, []); // Only on mount

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/api/banners/active');
      console.log('Banners fetched:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setBanners(response.data);
      } else {
        setBanners([]);
      }
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      setBanners([]);
      // Don't set error for banners - it's not critical
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        console.warn('CORS or network error when fetching banners');
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      // Fallback to empty array if categories fail to load
      setCategories([]);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit: 12,
        sort,
      };

      if (category !== 'All') {
        params.category = category;
      }

      // Use local searchTerm for live search (not URL search param)
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/api/products', { params });
      setProducts(response.data.items || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setProducts([]);
      
      // Set user-friendly error message
      if (error.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server. Please check your internet connection.');
      } else if (error.message?.includes('CORS') || error.response?.status === 0) {
        setError('CORS error: The server is not allowing requests from this origin. Please contact support.');
      } else if (error.response?.status === 404) {
        setError('API endpoint not found. The server may be updating.');
      } else {
        setError(`Failed to load products: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [category, sort, searchTerm, page]);

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setPage(1); // Reset to page 1 when filtering
    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  // Debounced live search - updates products directly without URL changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Update local search term for live product filtering
      setSearchTerm(searchInput.trim());
      setPage(1); // Reset to page 1 when search changes
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Fetch products when filters change (including live search term)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = () => {
    // Update URL when user clicks search button (for bookmarking/sharing)
    const trimmedSearch = searchInput.trim();
    setSearchTerm(trimmedSearch);
    updateParams('search', trimmedSearch);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    updateParams('search', '');
  };

  return (
    <div className="min-h-screen">
      {/* Banners Carousel */}
      {banners && banners.length > 0 && <BannerCarousel banners={banners} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Always show "All" first */}
            <button
              onClick={() => updateParams('category', '')}
              className={`px-4 py-2 rounded-lg transition ${
                category === 'All' || !category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {/* Show fetched categories */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateParams('category', cat.name)}
                className={`px-4 py-2 rounded-lg transition ${
                  category === cat.name
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
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

        {/* Search Results Message */}
        {searchTerm && !loading && (
          <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-blue-800 font-medium">
                Showing {total} result{total !== 1 ? 's' : ''} for &quot;{searchTerm}&quot;
              </p>
            </div>
            <button
              onClick={handleClearSearch}
              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-red-800 font-semibold mb-2">Error Loading Products</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchProducts();
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Retry
              </button>
            </div>
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

export default function MerchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <MerchPageContent />
    </Suspense>
  );
}

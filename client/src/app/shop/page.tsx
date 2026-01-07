'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
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

// Hardcoded products to show immediately during cold start (before API loads)
const HARDCODED_PRODUCTS: Product[] = [
  {
    _id: 'hardcoded-1',
    name: 'BIC Wheel Hub Pendent',
    slug: 'bic-wheel-hub-pendent',
    description: 'Premium wheel hub pendent for car enthusiasts.',
    price: 5.50,
    category: 'Accessories',
    tags: ['pendent', 'car', 'accessories'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 50,
    rating: 4.5,
    isFeatured: false,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-2',
    name: '1:24 MCLAREN F1 MCL36 DIECAST',
    slug: 'mclaren-f1-mcl36-diecast',
    description: 'Detailed 1:24 scale diecast model of McLaren F1 MCL36.',
    price: 22.00,
    category: 'Models',
    tags: ['diecast', 'mclaren', 'f1', 'model'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 30,
    rating: 4.8,
    isFeatured: true,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ShopPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>(HARDCODED_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollPositionRef = useRef<number>(0);

  const category = searchParams?.get('category') || 'All';
  const sort = searchParams?.get('sort') || 'newest';
  const search = searchParams?.get('search') || '';

  useEffect(() => {
    if (search) {
      setSearchInput(search);
      setSearchTerm(search);
    }
  }, []);

  const fetchBanners = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const response = await api.get('/api/banners/active', {
        params: { _t: timestamp, _r: random, _v: '1.0.0' },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (response.data && Array.isArray(response.data)) {
        setBanners([...response.data]);
      } else {
        setBanners([]);
      }
    } catch (error: any) {
      console.error('Error fetching banners:', error);
      setBanners([]);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const response = await api.get('/api/categories', {
        params: { _t: timestamp, _r: random, _v: '1.0.0' },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (response.data && Array.isArray(response.data)) {
        setCategories([...response.data]);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async (retryCount = 0) => {
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

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/api/products', { params });
      const fetchedProducts = response.data.items || [];
      
      const isFiltering = searchTerm || category !== 'All';
      
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        setIsInitialLoad(false);
      } else {
        if (!isInitialLoad || isFiltering) {
          setProducts([]);
          setIsInitialLoad(false);
        }
      }
      
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                           error.message?.includes('CORS') || 
                           error.response?.status === 0 ||
                           !error.response;
      
      if (isNetworkError && retryCount < 2) {
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      if (!isInitialLoad) {
        setProducts([]);
      }
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error: Unable to connect to the server.');
      } else if (error.message?.includes('CORS') || error.response?.status === 0) {
        setError('CORS error: The server is not allowing requests.');
      } else if (error.response?.status === 404) {
        setError('API endpoint not found.');
      } else {
        setError(`Failed to load products: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [category, sort, searchTerm, page, isInitialLoad]);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, [fetchBanners, fetchCategories]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBanners();
        fetchCategories();
        if (!loading) {
          fetchProducts();
        }
      }
    };

    const handleFocus = () => {
      fetchBanners();
      fetchCategories();
      if (!loading) {
        fetchProducts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchBanners, fetchCategories, fetchProducts, loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && scrollPositionRef.current > 0) {
      const savedScroll = scrollPositionRef.current;
      const restoreScroll = () => {
        window.scrollTo({
          top: savedScroll,
          behavior: 'instant' as ScrollBehavior,
        });
      };
      
      restoreScroll();
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll);
      });
      setTimeout(restoreScroll, 0);
      setTimeout(restoreScroll, 10);
      setTimeout(restoreScroll, 50);
    }
  }, [searchParams]);

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setPage(1);
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setProducts([]);
    }
    
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY;
    }
    
    const newUrl = `/shop?${params.toString()}`;
    router.replace(newUrl);
  }, [searchParams, router, isInitialLoad]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      setSearchTerm(trimmedSearch);
      setPage(1);
      if (trimmedSearch && isInitialLoad) {
        setIsInitialLoad(false);
        setProducts([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, isInitialLoad]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = () => {
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
      {banners && banners.length > 0 && (
        <BannerCarousel key={`banners-${banners.map(b => b._id).join('-')}`} banners={banners} />
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => updateParams('category', '')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                category === 'All' || !category
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={`${cat.id}-${cat.name}-${cat.slug}`}
                onClick={() => updateParams('category', cat.name)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  category === cat.name
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

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
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
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

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <ShopPageContent />
    </Suspense>
  );
}


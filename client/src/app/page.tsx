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
  {
    _id: 'hardcoded-3',
    name: '1:43 MERCEDES AMG-F1 W15 2024 SIGNATURE#44 HAMILTON',
    slug: 'mercedes-amg-f1-w15-hamilton',
    description: 'Limited edition 1:43 scale Mercedes AMG F1 W15 with Hamilton signature.',
    price: 18.00,
    category: 'Models',
    tags: ['mercedes', 'f1', 'hamilton', 'diecast'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 25,
    rating: 4.7,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-4',
    name: 'BIC Glass Straw',
    slug: 'bic-glass-straw',
    description: 'Eco-friendly reusable glass straw.',
    price: 3.00,
    category: 'Accessories',
    tags: ['straw', 'glass', 'eco-friendly'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 100,
    rating: 4.2,
    isFeatured: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-5',
    name: 'BIC Drinking Bottle',
    slug: 'bic-drinking-bottle',
    description: 'Premium reusable drinking bottle.',
    price: 5.00,
    category: 'Accessories',
    tags: ['bottle', 'reusable', 'water'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 80,
    rating: 4.4,
    isFeatured: false,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-6',
    name: '1:43 ALFA ROMEO F1 TEAM ORLEN C42 #77 BOTTAS',
    slug: 'alfa-romeo-f1-c42-bottas',
    description: '1:43 scale Alfa Romeo F1 Team Orlen C42 diecast model #77 Bottas.',
    price: 9.00,
    category: 'Models',
    tags: ['alfa-romeo', 'f1', 'bottas', 'diecast'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 40,
    rating: 4.6,
    isFeatured: false,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-7',
    name: '1:43 FERRARI SF-24 F1 #16 LECLERC',
    slug: 'ferrari-sf-24-f1-leclerc',
    description: '1:43 scale Ferrari SF-24 F1 diecast model #16 Leclerc.',
    price: 9.00,
    category: 'Models',
    tags: ['ferrari', 'f1', 'leclerc', 'diecast'],
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
    images: ['https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500'],
    inStock: true,
    stockQuantity: 35,
    rating: 4.7,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-8',
    name: 'MAPF1 RP DRIVER TEE-KIDS-WHITE',
    slug: 'mapf1-rp-driver-tee-kids-white',
    description: 'Kids white driver tee with MAPF1 RP design.',
    price: 15.00,
    category: 'T-Shirts',
    tags: ['kids', 'tee', 'white', 'f1'],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    inStock: true,
    stockQuantity: 60,
    rating: 4.5,
    isFeatured: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-9',
    name: 'MAPF1 FW MENS LARGE LOGO TEE WHITE',
    slug: 'mapf1-fw-mens-large-logo-tee-white',
    description: 'Mens white tee with large MAPF1 FW logo.',
    price: 20.00,
    category: 'T-Shirts',
    tags: ['mens', 'tee', 'white', 'logo'],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    inStock: true,
    stockQuantity: 70,
    rating: 4.6,
    isFeatured: true,
    isNew: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'hardcoded-10',
    name: 'MAPF1 FW MENS POLO TEAL',
    slug: 'mapf1-fw-mens-polo-teal',
    description: 'Mens teal polo shirt with MAPF1 FW branding.',
    price: 25.00,
    category: 'T-Shirts',
    tags: ['mens', 'polo', 'teal', 'f1'],
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
    inStock: true,
    stockQuantity: 55,
    rating: 4.5,
    isFeatured: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function MerchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize with hardcoded products for instant display (cold start fix)
  const [products, setProducts] = useState<Product[]>(HARDCODED_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Local search term for live updates
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const scrollPositionRef = useRef<number>(0); // Store scroll position to prevent scroll to top

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

  const fetchBanners = useCallback(async () => {
    try {
      // Add timestamp and random number to prevent caching
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      console.log('🔄 Fetching banners with timestamp:', timestamp, 'random:', random);
      const response = await api.get('/api/banners/active', {
        params: { 
          _t: timestamp,
          _r: random,
          _v: '1.0.0', // Version to bust cache
        },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      console.log('✅ Banners fetched:', response.data);
      if (response.data && Array.isArray(response.data)) {
        console.log('📋 Setting banners state with', response.data.length, 'banners');
        // Create new array to ensure React detects the change
        setBanners([...response.data]);
      } else {
        console.warn('⚠️ Invalid banners data:', response.data);
        setBanners([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching banners:', error);
      setBanners([]);
      // Don't set error for banners - it's not critical
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
        console.warn('CORS or network error when fetching banners');
      }
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      // Add timestamp and random number to prevent caching
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      console.log('🔄 Fetching categories with timestamp:', timestamp, 'random:', random);
      const response = await api.get('/api/categories', {
        params: { 
          _t: timestamp,
          _r: random,
          _v: '1.0.0', // Version to bust cache
        },
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      console.log('✅ Categories fetched:', response.data);
      if (response.data && Array.isArray(response.data)) {
        console.log('📋 Setting categories state with', response.data.length, 'categories');
        // Create new array to ensure React detects the change
        setCategories([...response.data]);
      } else {
        console.warn('⚠️ Invalid categories data:', response.data);
        setCategories([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      // Fallback to empty array if categories fail to load
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

      // Use local searchTerm for live search (not URL search param)
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/api/products', { params });
      const fetchedProducts = response.data.items || [];
      
      // Check if user is filtering/searching (not just initial load)
      const isFiltering = searchTerm || category !== 'All';
      
      // Replace hardcoded products with real data once API responds
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        setIsInitialLoad(false);
      } else {
        // Clear products if user is filtering/searching, or if it's not the initial load
        if (!isInitialLoad || isFiltering) {
          setProducts([]);
          setIsInitialLoad(false);
        }
        // If it's initial load with no filters, keep hardcoded products
      }
      
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      // Retry logic: retry up to 2 times for network errors
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                           error.message?.includes('CORS') || 
                           error.response?.status === 0 ||
                           !error.response;
      
      if (isNetworkError && retryCount < 2) {
        console.log(`Retrying fetchProducts (attempt ${retryCount + 1}/2)...`);
        // Retry after a short delay (exponential backoff)
        setTimeout(() => {
          fetchProducts(retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      // On error, only clear products if it's not the initial load
      // This way hardcoded products stay visible during cold start
      if (!isInitialLoad) {
        setProducts([]);
      }
      
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
  }, [category, sort, searchTerm, page, isInitialLoad]);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, [fetchBanners, fetchCategories]);

  // Refetch data when page becomes visible (user returns from checkout/admin panel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refetch all data to get latest updates
        fetchBanners();
        fetchCategories();
        // Only refetch products if not currently loading
        if (!loading) {
          fetchProducts();
        }
      }
    };

    const handleFocus = () => {
      // Window gained focus, refetch all data
      fetchBanners();
      fetchCategories();
      // Only refetch products if not currently loading
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

  // Prevent scroll to top when URL params change (for category/sort filtering)
  useEffect(() => {
    // Restore scroll position when searchParams change (but only if we have a saved position)
    if (typeof window !== 'undefined' && scrollPositionRef.current > 0) {
      const savedScroll = scrollPositionRef.current;
      // Use multiple attempts to ensure scroll is restored
      const restoreScroll = () => {
        window.scrollTo({
          top: savedScroll,
          behavior: 'instant' as ScrollBehavior,
        });
      };
      
      // Try immediately
      restoreScroll();
      
      // Try after DOM updates
      requestAnimationFrame(() => {
        requestAnimationFrame(restoreScroll);
      });
      
      // Try after short delays
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
    setPage(1); // Reset to page 1 when filtering
    // Clear hardcoded products when user filters
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setProducts([]);
    }
    
    // Save current scroll position before navigation
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY;
    }
    
    const newUrl = `/?${params.toString()}`;
    
    // Update URL using history API first to prevent scroll
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        { ...window.history.state, scroll: scrollPositionRef.current },
        '',
        newUrl
      );
    }
    
    // Prevent scroll by locking position before router update
    if (typeof window !== 'undefined') {
      // Lock scroll position immediately
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant' as ScrollBehavior,
      });
      
      // Add a scroll lock listener temporarily
      const preventScroll = (e: Event) => {
        e.preventDefault();
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior,
        });
      };
      
      // Temporarily prevent scroll events
      window.addEventListener('scroll', preventScroll, { passive: false, once: true });
      
      // Use router.replace to sync Next.js state
      router.replace(newUrl);
      
      // Immediately restore scroll position after router update
      const restoreScroll = () => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'instant' as ScrollBehavior,
        });
      };
      
      // Try multiple times to ensure scroll is preserved
      restoreScroll();
      Promise.resolve().then(restoreScroll);
      requestAnimationFrame(restoreScroll);
      requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
      setTimeout(restoreScroll, 0);
      setTimeout(restoreScroll, 10);
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 100);
      
      // Remove scroll lock after a short delay
      setTimeout(() => {
        window.removeEventListener('scroll', preventScroll);
      }, 200);
    } else {
      router.replace(newUrl);
    }
  }, [searchParams, router, isInitialLoad]);

  // Debounced live search - updates products directly without URL changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      // Update local search term for live product filtering
      setSearchTerm(trimmedSearch);
      setPage(1); // Reset to page 1 when search changes
      // Clear hardcoded products when user starts searching
      if (trimmedSearch && isInitialLoad) {
        setIsInitialLoad(false);
        setProducts([]);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchInput, isInitialLoad]);

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
      {banners && banners.length > 0 && (
        <BannerCarousel key={`banners-${banners.map(b => b._id).join('-')}`} banners={banners} />
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Category Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {/* Always show "All" first */}
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
            {/* Show fetched categories */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
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

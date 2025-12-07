'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (params?.slug) {
      fetchProduct(params.slug as string);
    }
  }, [params?.slug]);

  const fetchProduct = async (slug: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products/${slug}`);
      setProduct(response.data);

      // Fetch related products
      const relatedResponse = await api.get('/api/products', {
        params: { category: response.data.category, limit: 4 },
      });
      setRelatedProducts(
        relatedResponse.data.items.filter((p: Product) => p._id !== response.data._id)
      );
    } catch (error) {
      console.error('Error fetching product:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      setAuthMessage('Please log in to continue. Only logged-in users can add items to the cart.');
      return;
    }

    if (product) {
      addItem(product, quantity);
      setAddedToCart(true);
      setAuthMessage('');
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Combine main image with additional images array
  // Main image should be first, followed by additional images
  const images = [product.image, ...(product.images || [])].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Product Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Images */}
        <div>
          {/* Main Image */}
          <div className="relative aspect-square mb-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-zoom-in">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-110"
              priority
            />
          </div>
          
          {/* Thumbnail Gallery - Always show, even for single image */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === idx 
                    ? 'border-primary-600 ring-2 ring-primary-200' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <Image 
                  src={img} 
                  alt={`${product.name} ${idx + 1}`} 
                  fill 
                  className="object-cover" 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">
            {product.category}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-gray-600">({product.rating})</span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mb-6">{formatPrice(product.price, language === 'ar' ? 'ar-BH' : 'en-BH')}</p>

          <p className="text-gray-700 mb-6">{product.description}</p>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-6">
            {product.inStock && product.stockQuantity > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-green-600 font-semibold">
                  In Stock
                  {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                    <span className="text-orange-600 ml-2">
                      (Only {product.stockQuantity} left!)
                    </span>
                  )}
                  {product.stockQuantity > 5 && (
                    <span className="text-gray-600 ml-2 font-normal">
                      ({product.stockQuantity} available)
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-600 font-bold text-lg">Out of Stock</p>
                </div>
                <p className="text-sm text-red-700">This product is currently unavailable.</p>
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart - ONLY show if in stock and quantity > 0 */}
          {product.inStock && product.stockQuantity > 0 ? (
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition"
                  >
                    -
                  </button>
                  <span className="px-6 py-2 border-x font-semibold">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stockQuantity, quantity + 1))
                    }
                    className="px-4 py-2 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!user}
                  className="flex-1 bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
                </button>
              </div>

              {!user && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/auth/login?redirect=/product/${product.slug}`)
                      }
                      className="underline font-semibold hover:text-yellow-900"
                    >
                      Log in
                    </button>
                    {' '}to add items to your cart
                  </p>
                </div>
              )}

              {authMessage && (
                <p className="text-sm text-red-600">
                  {authMessage}
                </p>
              )}
            </div>
          ) : (
            !product.inStock || product.stockQuantity === 0 ? (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <p className="text-gray-700 font-medium mb-2">Want to be notified when this is back?</p>
                <button className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition">
                  Notify Me When Available
                </button>
              </div>
            ) : null
          )}

          <p className="text-xs text-gray-500 mt-4">
            Secure checkout &amp; protected data —{' '}
            <Link href="/privacy-policy" className="text-primary-600 hover:text-primary-700 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


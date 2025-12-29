import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

// Local price formatter
function formatPriceLocal(amount: number): string {
  if (Number.isNaN(amount)) return '';
  try {
    return new Intl.NumberFormat('en-BH', {
      style: 'currency',
      currency: 'BHD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} BHD`;
  }
}

// Extract brand from product name (e.g., "Samuel Bailey Signature Check Shirt" -> "SAMUEL BAILEY")
function extractBrand(productName: string, category: string): string {
  // Common brand patterns
  const brandPatterns = [
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+/,
    /^([A-Z]+(?:\s+[A-Z]+)*)\s+/,
  ];

  for (const pattern of brandPatterns) {
    const match = productName.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  // Fallback to category
  return category.toUpperCase();
}

// Get promotional banner text
function getPromotionalBanner(product: Product): { text: string; icon: 'clock' | 'bag' | 'fire' } | null {
  if (product.isNew) {
    return { text: "NEW ARRIVAL!", icon: 'fire' };
  }
  if (product.isFeatured) {
    return { text: "HOT RIGHT NOW!", icon: 'fire' };
  }
  if (product.stockQuantity && product.stockQuantity < 10) {
    return { text: "LOW STOCK!", icon: 'clock' };
  }
  return null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const brand = extractBrand(product.name, product.category);
  const promotionalBanner = getPromotionalBanner(product);
  
  // Get images - use main image and second image if available
  const primaryImage = product.image;
  const secondaryImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : null;
  const displayImage = isHovered && secondaryImage ? secondaryImage : primaryImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0)) {
      return;
    }

    if (!user) {
      router.push(`/auth/login?redirect=/product/${product.slug}`);
      return;
    }

    try {
      setAdding(true);
      addItem(product, 1);
    } finally {
      setTimeout(() => setAdding(false), 500);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
  };

  return (
    <div 
      className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="flex-1 flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Primary Image */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Secondary Image (shown on hover) */}
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.name} - alternate view`}
              fill
              className={`object-cover transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}
          
          {/* Promotional Label (Custom) */}
          {product.promotionalLabel && (
            <div 
              className="absolute top-2 left-2 px-3 py-1.5 rounded text-xs font-bold text-white shadow-lg"
              style={{ 
                backgroundColor: product.promotionalLabelColor || '#ef4444' 
              }}
            >
              {product.promotionalLabel}
            </div>
          )}

          {/* Promotional Banner (Auto-generated if no custom label) */}
          {!product.promotionalLabel && promotionalBanner && (
            <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-80 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5">
              {promotionalBanner.icon === 'clock' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
              {promotionalBanner.icon === 'bag' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              )}
              {promotionalBanner.icon === 'fire' && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              )}
              <span>{promotionalBanner.text}</span>
            </div>
          )}

          {/* Action Icons Overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleWishlist}
              className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
              aria-label="Add to wishlist"
            >
              <svg
                className={`w-4 h-4 ${isWishlisted ? 'text-red-500 fill-current' : 'text-gray-600'}`}
                fill={isWishlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-4 py-2 rounded font-semibold text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Brand Name */}
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            {brand}
          </p>

          {/* Product Name */}
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition" style={{ fontFamily: 'BRHendrix, system-ui, sans-serif' }}>
            {product.name}
          </h3>

          {/* Size Availability */}
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-gray-500">Sizes:</span>
            <div className="flex gap-1">
              {['S', 'M', 'L', 'XL'].map((size) => (
                <span
                  key={size}
                  className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-lg font-bold text-gray-900">
              {formatPriceLocal(product.price)}
            </p>
          </div>
        </div>
      </Link>

      {/* Add to Cart Icon Button */}
      <button
        onClick={handleAddToCart}
        disabled={!product.inStock || adding || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
        className="absolute bottom-4 right-4 bg-primary-600 text-white rounded-full p-3 shadow-lg hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
        aria-label="Add to cart"
      >
        {adding ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
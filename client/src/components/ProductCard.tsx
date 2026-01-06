import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

// Local price formatter so we don't depend on '@/lib/currency' here
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

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
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

  const handleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist API call
  };

  // Determine promotional label
  const getPromotionalLabel = () => {
    if (product.promotionalLabel) {
      return {
        text: product.promotionalLabel,
        color: product.promotionalLabelColor || '#ef4444',
      };
    }
    if (product.isNew) {
      return {
        text: 'NEW ARRIVAL!',
        color: '#ef4444',
        icon: 'fire',
      };
    }
    if (product.isFeatured) {
      return {
        text: 'HOT RIGHT NOW!',
        color: '#ef4444',
        icon: 'fire',
      };
    }
    if (product.stockQuantity < 10 && product.stockQuantity > 0) {
      return {
        text: 'LOW STOCK!',
        color: '#ef4444',
        icon: 'clock',
      };
    }
    return null;
  };

  const promotionalLabel = getPromotionalLabel();
  
  // Find a secondary image that's different from the main image
  const findSecondaryImage = () => {
    // First check if there's an explicit secondaryImage field
    if (product.secondaryImage && product.secondaryImage !== product.image) {
      return product.secondaryImage;
    }
    
    // Then check the images array for a different image
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Find the first image in the array that's different from the main image
      for (const img of product.images) {
        if (img && img !== product.image && img.trim() !== '') {
          return img;
        }
      }
    }
    
    return null;
  };
  
  const secondaryImage = findSecondaryImage();
  const hasMultipleImages = !!secondaryImage;
  const displayImage = isHovered && secondaryImage ? secondaryImage : product.image;

  // Extract brand name from product name or use category
  const brandName = product.name.split(' ')[0] || product.category;

  return (
    <div
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="flex-1 flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Primary Image */}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'
            } ${!hasMultipleImages ? 'group-hover:scale-105 transition-transform duration-300' : ''}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Secondary Image (on hover) */}
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={product.name}
              fill
              className={`object-cover transition-opacity duration-300 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}

          {/* Promotional Label */}
          {promotionalLabel && (
            <div
              className="absolute top-2 left-2 px-3 py-1.5 rounded shadow-lg z-10"
              style={{ backgroundColor: promotionalLabel.color }}
            >
              <div className="flex items-center space-x-1">
                {promotionalLabel.icon === 'fire' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 7 7 0 1011.95 6.05a1 1 0 00-1.45-.385c-.34.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 7 7 0 1011.95 6.05z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {promotionalLabel.icon === 'clock' && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <span className="text-xs font-bold text-white">{promotionalLabel.text}</span>
              </div>
            </div>
          )}

          {/* Wishlist Icon (visible on hover) */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-2 shadow-md z-10 hover:scale-110 transition-transform"
            aria-label="Add to wishlist"
          >
            <svg
              className={`w-4 h-4 ${isWishlisted ? 'text-primary-600 fill-current' : 'text-gray-700'}`}
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <span className="bg-white text-gray-900 px-4 py-2 rounded font-semibold text-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {/* Brand Name */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
            {brandName}
          </p>

          {/* Product Title */}
          <h3 className="text-[15px] font-semibold text-gray-900 mb-2 truncate group-hover:text-primary-600 transition" title={product.name}>
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-lg font-bold text-gray-900">
              {formatPriceLocal(product.price)}
            </p>
          </div>
        </div>
      </Link>

      {/* Add to Cart Button (Circular, bottom-right) */}
      {product.inStock && (
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
          className="absolute bottom-4 right-4 bg-primary-600 text-white rounded-full p-3 shadow-lg hover:bg-primary-700 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          aria-label="Add to cart"
        >
          {adding ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
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
      )}
    </div>
  );
}

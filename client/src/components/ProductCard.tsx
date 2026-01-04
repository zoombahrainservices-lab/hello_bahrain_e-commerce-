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
      // Add a single unit from the listing
      addItem(product, 1);
    } finally {
      setTimeout(() => setAdding(false), 500);
    }
  };

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <Link href={`/product/${product.slug}`} className="flex-1 flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {product.isNew && (
            <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
              New
            </span>
          )}
          {product.isFeatured && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Hot
            </span>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-gray-900 px-4 py-2 rounded font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="min-h-[3.5rem]">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">
              {product.category}
            </p>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <p className="text-xl font-bold text-gray-900">
              {formatPriceLocal(product.price)}
            </p>
            {product.inStock && (
              <span className="text-xs text-green-600 font-medium">In Stock</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-0">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock || adding || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
          className="w-full mt-2 bg-primary-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.inStock
            ? adding
              ? 'Adding...'
              : 'Add to Cart'
            : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
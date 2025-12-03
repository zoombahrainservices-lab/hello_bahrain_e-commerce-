import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t, language } = useLanguage();
  
  // Check if product is actually available (in stock AND has quantity > 0)
  const isAvailable = product.inStock && product.stockQuantity > 0;
  
  return (
    <Link href={`/product/${product.slug}`}>
      <div className={`group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-transform duration-300 ${isAvailable ? 'group-hover:scale-105' : 'grayscale'}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {product.isNew && isAvailable && (
            <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
              {language === 'ar' ? 'جديد' : 'New'}
            </span>
          )}
          {product.isFeatured && isAvailable && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {language === 'ar' ? 'مميز' : 'Hot'}
            </span>
          )}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                {t('outOfStock')}
              </span>
            </div>
          )}
          {isAvailable && product.stockQuantity <= 5 && (
            <span className="absolute bottom-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
              Only {product.stockQuantity} left
            </span>
          )}
        </div>

        <div className="p-4">
          {/* Category + name block given fixed height so all cards align */}
          <div className="min-h-[3.5rem]">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">
              {product.category}
            </p>
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition">
              {product.name}
            </h3>
          </div>

          {/* Rating */}
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

          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(product.price, language === 'ar' ? 'ar-BH' : 'en-BH')}
            </p>
            {isAvailable ? (
              product.stockQuantity <= 5 ? (
                <span className="text-xs text-orange-600 font-bold">Low Stock</span>
              ) : (
                <span className="text-xs text-green-600 font-medium">{t('inStock')}</span>
              )
            ) : (
              <span className="text-xs text-red-600 font-bold">{t('outOfStock')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}


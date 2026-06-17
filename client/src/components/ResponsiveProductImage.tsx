'use client';

import {
  buildSrcSet,
  hasResponsiveVariants,
  pickSrcForUsage,
  type ImageUsage,
  type StorefrontImageVariants,
} from '@/lib/media/storefront-urls';

interface ResponsiveProductImageProps {
  src: string;
  alt: string;
  variants?: StorefrontImageVariants | null;
  /** Responsive image context — selects the right variant. */
  usage?: ImageUsage;
  /** @deprecated Use usage="thumbnail" instead. */
  thumbnail?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}

const DEFAULT_SIZES: Record<ImageUsage, string> = {
  admin: '150px',
  card: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw',
  cart: '96px',
  detail: '(max-width: 1024px) 100vw, 50vw',
  thumbnail: '80px',
  hero: '100vw',
  zoom: '(max-width: 1024px) 100vw, 50vw',
};

export default function ResponsiveProductImage({
  src,
  alt,
  variants,
  usage,
  thumbnail = false,
  fill,
  width,
  height,
  sizes,
  className,
  priority,
  onError,
}: ResponsiveProductImageProps) {
  const resolvedUsage: ImageUsage = usage ?? (thumbnail ? 'thumbnail' : 'detail');

  if (!hasResponsiveVariants(variants)) {
    return (
      <img
        src={src}
        alt={alt}
        className={
          fill
            ? `absolute inset-0 h-full w-full object-cover ${className ?? ''}`.trim()
            : className
        }
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={onError}
      />
    );
  }

  const imgSrc = pickSrcForUsage(variants, src, resolvedUsage);
  const srcSet = buildSrcSet(variants, resolvedUsage);
  const imgSizes = sizes ?? DEFAULT_SIZES[resolvedUsage];
  const imgClassName = fill
    ? `absolute inset-0 h-full w-full ${className ?? ''}`.trim()
    : className;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      srcSet={srcSet}
      sizes={imgSizes}
      alt={alt}
      className={imgClassName}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={onError}
    />
  );
}

/** Resolve variants for a combined main+gallery image list on the product page. */
export function getProductImageVariants(
  product: {
    imageVariants?: StorefrontImageVariants | null;
    galleryVariants?: StorefrontImageVariants[];
  },
  index: number
): StorefrontImageVariants | null | undefined {
  if (index === 0) return product.imageVariants;
  return product.galleryVariants?.[index - 1];
}

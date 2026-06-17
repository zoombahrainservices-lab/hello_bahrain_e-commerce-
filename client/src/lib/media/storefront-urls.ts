import { MEDIA_VARIANTS } from './constants';
import type { MediaVariantType } from './types';

export type StorefrontImageVariants = Partial<Record<MediaVariantType, string>>;

export type ImageUsage =
  | 'admin'
  | 'card'
  | 'cart'
  | 'detail'
  | 'thumbnail'
  | 'hero'
  | 'zoom';

/** Variants included in responsive srcSet, smallest to largest. */
const SRCSET_VARIANTS: { variant: MediaVariantType; width: number }[] = [
  { variant: 'xs', width: MEDIA_VARIANTS.xs },
  { variant: 'small', width: MEDIA_VARIANTS.small },
  { variant: 'card', width: MEDIA_VARIANTS.card },
  { variant: 'medium', width: MEDIA_VARIANTS.medium },
  { variant: 'large', width: MEDIA_VARIANTS.large },
  { variant: 'xl', width: MEDIA_VARIANTS.xl },
];

const DETAIL_SRCSET_VARIANTS: { variant: MediaVariantType; width: number }[] = [
  { variant: 'medium', width: MEDIA_VARIANTS.medium },
  { variant: 'large', width: MEDIA_VARIANTS.large },
  { variant: 'xl', width: MEDIA_VARIANTS.xl },
];

const CARD_SRCSET_VARIANTS: { variant: MediaVariantType; width: number }[] = [
  { variant: 'small', width: MEDIA_VARIANTS.small },
  { variant: 'card', width: MEDIA_VARIANTS.card },
];

function firstAvailable(
  variants: StorefrontImageVariants | null | undefined,
  names: MediaVariantType[],
  fallbackUrl: string
): string {
  if (!variants) return fallbackUrl;
  for (const name of names) {
    if (variants[name]) return variants[name]!;
  }
  return (
    variants.svg_preview ??
    variants.medium ??
    variants.small ??
    variants.thumb ??
    variants.original ??
    fallbackUrl
  );
}

export function hasResponsiveVariants(
  variants?: StorefrontImageVariants | null
): variants is StorefrontImageVariants {
  if (!variants) return false;
  const names = Object.keys(MEDIA_VARIANTS) as (keyof typeof MEDIA_VARIANTS)[];
  return names.some((variant) => Boolean(variants[variant]));
}

/** Admin media grid — thumb variant. */
export function pickAdminSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['thumb', 'tiny', 'xs', 'small'], fallbackUrl);
}

/** Product listing/card — card or small. */
export function pickCardSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['card', 'small', 'xs'], fallbackUrl);
}

/** Cart and order summary — xs. */
export function pickCartSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['xs', 'thumb', 'small'], fallbackUrl);
}

/** Product detail mobile/tablet — medium. */
export function pickDetailMobileSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['medium', 'card', 'large'], fallbackUrl);
}

/** Product detail desktop — large. */
export function pickDetailDesktopSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['large', 'medium', 'xl'], fallbackUrl);
}

/** Product zoom / high-quality view — xl. */
export function pickZoomSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['xl', 'large', 'hero'], fallbackUrl);
}

/** Banners and homepage hero — hero variant. */
export function pickHeroSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['hero', 'xl', 'large'], fallbackUrl);
}

/** Gallery strip / small fixed slots — thumb. */
export function pickThumbSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return firstAvailable(variants, ['thumb', 'tiny', 'xs'], fallbackUrl);
}

/** Default src for img based on usage context. */
export function pickSrcForUsage(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string,
  usage: ImageUsage = 'detail'
): string {
  switch (usage) {
    case 'admin':
      return pickAdminSrc(variants, fallbackUrl);
    case 'card':
      return pickCardSrc(variants, fallbackUrl);
    case 'cart':
      return pickCartSrc(variants, fallbackUrl);
    case 'thumbnail':
      return pickThumbSrc(variants, fallbackUrl);
    case 'hero':
      return pickHeroSrc(variants, fallbackUrl);
    case 'zoom':
      return pickZoomSrc(variants, fallbackUrl);
    case 'detail':
    default:
      return pickDetailMobileSrc(variants, fallbackUrl);
  }
}

/** @deprecated Use pickSrcForUsage with usage="detail". */
export function pickDefaultSrc(
  variants: StorefrontImageVariants | null | undefined,
  fallbackUrl: string
): string {
  return pickDetailMobileSrc(variants, fallbackUrl);
}

export function buildSrcSet(
  variants: StorefrontImageVariants | null | undefined,
  usage: ImageUsage = 'detail'
): string | undefined {
  if (!variants) return undefined;

  const list =
    usage === 'card'
      ? CARD_SRCSET_VARIANTS
      : usage === 'hero'
        ? [{ variant: 'hero' as MediaVariantType, width: MEDIA_VARIANTS.hero }]
        : usage === 'detail' || usage === 'zoom'
          ? DETAIL_SRCSET_VARIANTS
          : SRCSET_VARIANTS;

  const parts = list.flatMap(({ variant, width }) => {
    const url = variants[variant];
    return url ? [`${url} ${width}w`] : [];
  });

  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * Derive a hero WebP URL from a media-library original URL when variants
 * were not loaded (e.g. legacy banner records).
 */
export function deriveHeroUrlFromMediaPath(url: string): string {
  if (!url) return url;
  const match = url.match(/^(.*\/media\/\d{4}\/\d{2}\/[^/]+)\/original\.[a-z0-9]+$/i);
  if (match) return `${match[1]}/hero.webp`;
  return url;
}

export function pickBannerImageSrc(imageUrl: string): string {
  return deriveHeroUrlFromMediaPath(imageUrl);
}

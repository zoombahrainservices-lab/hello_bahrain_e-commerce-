export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.svg'] as const;

export const BLOCKED_EXTENSIONS = [
  '.php', '.exe', '.html', '.htm', '.js', '.mjs',
  '.sh', '.bat', '.cmd', '.scr', '.jar', '.zip',
] as const;

export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_SVG_SIZE_MB = 1;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_SVG_SIZE_BYTES = MAX_SVG_SIZE_MB * 1024 * 1024;

export const WEBP_QUALITY = 82;

/** Max width/height for the archived original (never upscaled). */
export const ORIGINAL_MAX_DIMENSION = 2560;
export const ORIGINAL_JPEG_QUALITY = 85;
export const ORIGINAL_WEBP_QUALITY = 90;
export const ORIGINAL_PNG_COMPRESSION = 9;

/** Responsive WebP variant widths (never upscale beyond original). */
export const MEDIA_VARIANTS = {
  tiny:   100,
  thumb:  150,
  xs:     250,
  small:  400,
  card:   500,
  medium: 800,
  large:  1200,
  xl:     1600,
  hero:   1920,
} as const;

export type VariantName = keyof typeof MEDIA_VARIANTS;

export const SVG_PREVIEW_SIZE = 400;

export const DEFAULT_FOLDER_SLUGS = {
  products:   'products',
  banners:    'banners',
  news:       'news',
  events:     'events',
  categories: 'categories',
  logos:      'logos',
  posters:    'posters',
  directory:  'directory',
  general:    'general',
} as const;

import { z } from 'zod';
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  BLOCKED_EXTENSIONS,
  MAX_IMAGE_SIZE_BYTES,
  MAX_SVG_SIZE_BYTES,
} from './constants';

// ─── Upload validation ────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUploadedFile(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
): FileValidationResult {
  const ext = ('.' + fileName.split('.').pop()?.toLowerCase()) as string;

  if (BLOCKED_EXTENSIONS.includes(ext as typeof BLOCKED_EXTENSIONS[number])) {
    return { valid: false, error: `File type ${ext} is not allowed.` };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return { valid: false, error: `File extension ${ext} is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return { valid: false, error: `MIME type ${mimeType} is not allowed.` };
  }

  const isSvg = mimeType === 'image/svg+xml';
  const sizeLimit = isSvg ? MAX_SVG_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  const sizeLimitMb = isSvg ? 1 : 10;

  if (sizeBytes > sizeLimit) {
    return { valid: false, error: `File is too large. Maximum size is ${sizeLimitMb}MB.` };
  }

  return { valid: true };
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return map[mimeType] ?? 'bin';
}

export function getFormatFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpeg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return map[mimeType] ?? 'unknown';
}

// ─── Zod schemas ─────────────────────────────────────────────

export const uploadMetadataSchema = z.object({
  folderId: z.string().uuid().optional().nullable(),
  altText:  z.string().max(500).optional(),
  title:    z.string().max(200).optional(),
  caption:  z.string().max(500).optional(),
});

export const mediaUpdateSchema = z.object({
  folderId:    z.string().uuid().nullable().optional(),
  altText:     z.string().max(500).nullable().optional(),
  title:       z.string().max(200).nullable().optional(),
  caption:     z.string().max(500).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  seoFileName: z.string().max(200).nullable().optional(),
});

export const mediaListSchema = z.object({
  q:        z.string().optional(),
  folderId: z.string().uuid().optional(),
  mimeType: z.string().optional(),
  sort: z
    .enum(['newest', 'oldest', 'file_size_asc', 'file_size_desc', 'name_asc', 'name_desc'])
    .optional()
    .default('newest'),
  page:  z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
});

export const attachMediaSchema = z.object({
  mediaId:    z.string().uuid(),
  role:       z.enum(['main_image', 'gallery_image', 'thumbnail', 'variant_image']),
  sortOrder:  z.number().int().min(0).optional().default(0),
});

export const reorderGallerySchema = z.object({
  items: z.array(
    z.object({
      mediaId:   z.string().uuid(),
      sortOrder: z.number().int().min(0),
    }),
  ).min(1),
});

export const attachMediaBatchSchema = z.object({
  mediaIds: z.array(z.string().uuid()).min(1).max(50),
  mainMediaId: z.string().uuid().optional(),
});

export const syncProductMediaOrderSchema = z.object({
  orderedMediaIds: z.array(z.string().uuid()).max(50),
});

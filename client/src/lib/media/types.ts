export type MediaStatus = 'processing' | 'active' | 'failed' | 'trashed';

export type MediaVariantType =
  | 'original'
  | 'tiny'
  | 'thumb'
  | 'xs'
  | 'small'
  | 'card'
  | 'medium'
  | 'large'
  | 'xl'
  | 'hero'
  | 'svg_preview';

export type MediaUsageEntityType =
  | 'product'
  | 'banner'
  | 'news'
  | 'event'
  | 'category'
  | 'logo'
  | 'poster'
  | 'directory'
  | 'general';

export type ProductMediaRole =
  | 'main_image'
  | 'gallery_image'
  | 'thumbnail'
  | 'variant_image';

export type UploadStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled';

// ─── Database row shapes (snake_case from Supabase) ──────────

export interface MediaFolderRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaItemRow {
  id: string;
  folder_id: string | null;
  original_file_name: string;
  file_name: string;
  seo_file_name: string | null;
  mime_type: string;
  extension: string;
  format: string;
  file_size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  storage_disk: string;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  file_hash: string | null;
  status: MediaStatus;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  error_message: string | null;
}

export interface MediaVariantRow {
  id: string;
  media_id: string;
  variant: MediaVariantType;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  mime_type: string;
  extension: string;
  format: string;
  storage_path: string;
  public_url: string;
  created_at: string;
}

export interface MediaUsageRow {
  id: string;
  media_id: string;
  used_in_type: MediaUsageEntityType;
  used_in_id: string;
  used_as: string;
  created_at: string;
  updated_at: string;
}

export interface ProductMediaRow {
  id: string;
  product_id: string;
  media_id: string;
  role: ProductMediaRole;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ─── Application-level types (camelCase) ─────────────────────

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  folderId: string | null;
  originalFileName: string;
  fileName: string;
  seoFileName: string | null;
  mimeType: string;
  extension: string;
  format: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  storagePath: string;
  publicUrl: string | null;
  fileHash: string | null;
  status: MediaStatus;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaVariant {
  id: string;
  mediaId: string;
  variant: MediaVariantType;
  width: number | null;
  height: number | null;
  fileSizeBytes: number | null;
  mimeType: string;
  extension: string;
  format: string;
  storagePath: string;
  publicUrl: string;
  createdAt: string;
}

export interface MediaUsage {
  id: string;
  mediaId: string;
  usedInType: MediaUsageEntityType;
  usedInId: string;
  usedAs: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMedia {
  id: string;
  productId: string;
  mediaId: string;
  role: ProductMediaRole;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  media?: MediaItemWithVariants;
}

export interface MediaItemWithVariants extends MediaItem {
  variants: MediaVariant[];
  folder?: MediaFolder | null;
}

export interface MediaItemWithVariantsAndUsageCount extends MediaItemWithVariants {
  usageCount: number;
}

// ─── Service params ───────────────────────────────────────────

export interface CreateMediaParams {
  buffer: Buffer;
  originalFileName: string;
  mimeType: string;
  folderId?: string | null;
  altText?: string;
  title?: string;
  caption?: string;
  uploadedBy?: string;
}

export interface ListMediaParams {
  q?: string;
  folderId?: string;
  mimeType?: string;
  sort?: 'newest' | 'oldest' | 'file_size_asc' | 'file_size_desc' | 'name_asc' | 'name_desc';
  page?: number;
  limit?: number;
}

export interface UpdateMediaParams {
  folderId?: string | null;
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  seoFileName?: string | null;
}

export interface AttachMediaToProductParams {
  productId: string;
  mediaId: string;
  role: ProductMediaRole;
  sortOrder?: number;
}

export interface ReorderGalleryItem {
  mediaId: string;
  sortOrder: number;
}

export interface ProcessedVariant {
  variant: 'tiny' | 'thumb' | 'xs' | 'small' | 'card' | 'medium' | 'large' | 'xl' | 'hero' | 'svg_preview';
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: 'image/webp';
  extension: 'webp';
  format: 'webp';
  fileSizeBytes: number;
}

export interface MediaListResponse {
  items: MediaItemWithVariantsAndUsageCount[];
  page: number;
  limit: number;
  total: number;
}

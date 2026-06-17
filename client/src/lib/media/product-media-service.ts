import { getSupabase } from '@/lib/db';
import {
  AttachMediaToProductParams,
  ReorderGalleryItem,
  ProductMedia,
  ProductMediaRow,
  ProductMediaRole,
} from './types';
import { getMediaById } from './media-service';
import { DEFAULT_FOLDER_SLUGS } from './constants';
import {
  buildMediaUrlIndex,
  resolveMediaIdFromUrl,
} from './url-match';

// ─── Row mapper ───────────────────────────────────────────────

async function rowToProductMedia(row: ProductMediaRow): Promise<ProductMedia> {
  const media = await getMediaById(row.media_id);
  return {
    id: row.id,
    productId: row.product_id,
    mediaId: row.media_id,
    role: row.role,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: media ?? undefined,
  };
}

// ─── getProductMedia ──────────────────────────────────────────

export async function getProductMedia(productId: string): Promise<ProductMedia[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to get product media: ${error.message}`);

  return Promise.all((data ?? []).map((row: ProductMediaRow) => rowToProductMedia(row)));
}

// ─── attachMediaToProduct ─────────────────────────────────────

export async function attachMediaToProduct(params: AttachMediaToProductParams): Promise<ProductMedia> {
  const supabase = getSupabase();
  const { productId, mediaId, role, sortOrder = 0 } = params;

  // Verify media exists and is active
  const media = await getMediaById(mediaId);
  if (!media) throw new Error('Media item not found.');
  if (media.status !== 'active') throw new Error('Media item is not active.');

  const { data, error } = await supabase
    .from('product_media')
    .insert({
      product_id: productId,
      media_id: mediaId,
      role,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to attach media: ${error.message}`);

  // Sync usage tracking
  await syncMediaUsage(mediaId, productId, role);

  // Backward compat: sync product.image / product.images
  await syncProductImageColumns(productId);

  return rowToProductMedia(data as ProductMediaRow);
}

// ─── setMainProductImage ──────────────────────────────────────

export async function setMainProductImage(productId: string, mediaId: string): Promise<ProductMedia> {
  const supabase = getSupabase();

  // Remove existing main_image entry if any
  const { data: existingMain } = await supabase
    .from('product_media')
    .select('id, media_id')
    .eq('product_id', productId)
    .eq('role', 'main_image')
    .maybeSingle();

  if (existingMain && existingMain.media_id !== mediaId) {
    await supabase.from('product_media').delete().eq('id', existingMain.id);
    await supabase
      .from('media_usages')
      .delete()
      .match({
        media_id: existingMain.media_id,
        used_in_type: 'product',
        used_in_id: productId,
        used_as: 'main_image',
      });
  }

  // If this media is already a gallery image, promote it (remove gallery row first)
  const { data: existingGallery } = await supabase
    .from('product_media')
    .select('id')
    .eq('product_id', productId)
    .eq('media_id', mediaId)
    .eq('role', 'gallery_image')
    .maybeSingle();

  if (existingGallery) {
    await supabase.from('product_media').delete().eq('id', existingGallery.id);
    await supabase
      .from('media_usages')
      .delete()
      .match({
        media_id: mediaId,
        used_in_type: 'product',
        used_in_id: productId,
        used_as: 'gallery_image',
      });
  }

  // Already the main image — nothing to change
  if (existingMain?.media_id === mediaId) {
    const { data: row } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .eq('media_id', mediaId)
      .eq('role', 'main_image')
      .single();
    if (row) return rowToProductMedia(row as ProductMediaRow);
  }

  return attachMediaToProduct({ productId, mediaId, role: 'main_image', sortOrder: 0 });
}

// ─── addGalleryImage ──────────────────────────────────────────

export async function addGalleryImage(productId: string, mediaId: string): Promise<ProductMedia> {
  const supabase = getSupabase();

  // Skip if already attached as main or gallery
  const { data: existing } = await supabase
    .from('product_media')
    .select('id, role')
    .eq('product_id', productId)
    .eq('media_id', mediaId)
    .maybeSingle();

  if (existing) {
    if (existing.role === 'gallery_image') {
      const { data: row } = await supabase
        .from('product_media')
        .select('*')
        .eq('id', existing.id)
        .single();
      return rowToProductMedia(row as ProductMediaRow);
    }
    throw new Error('This image is already the main product image.');
  }

  // Get current max sort_order for gallery images
  const { data: lastGallery } = await supabase
    .from('product_media')
    .select('sort_order')
    .eq('product_id', productId)
    .eq('role', 'gallery_image')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = lastGallery ? lastGallery.sort_order + 10 : 10;

  return attachMediaToProduct({
    productId,
    mediaId,
    role: 'gallery_image',
    sortOrder: nextSortOrder,
  });
}

// ─── removeMediaFromProduct ───────────────────────────────────

export async function removeMediaFromProduct(productId: string, mediaId: string): Promise<void> {
  const supabase = getSupabase();

  // Find the product_media row
  const { data: row } = await supabase
    .from('product_media')
    .select('id, role')
    .eq('product_id', productId)
    .eq('media_id', mediaId)
    .maybeSingle();

  if (!row) return;

  await supabase.from('product_media').delete().eq('id', row.id);

  // Remove matching usage record
  await supabase
    .from('media_usages')
    .delete()
    .match({
      media_id: mediaId,
      used_in_type: 'product',
      used_in_id: productId,
      used_as: row.role,
    });

  // Backward compat: sync product.image / product.images
  await syncProductImageColumns(productId);
}

// ─── reorderProductGallery ────────────────────────────────────

export async function reorderProductGallery(
  productId: string,
  items: ReorderGalleryItem[],
): Promise<void> {
  const supabase = getSupabase();

  await Promise.all(
    items.map(({ mediaId, sortOrder }) =>
      supabase
        .from('product_media')
        .update({ sort_order: sortOrder, updated_at: new Date().toISOString() })
        .eq('product_id', productId)
        .eq('media_id', mediaId)
        .eq('role', 'gallery_image'),
    ),
  );

  // Keep flat cache columns in sync after reorder
  await syncProductImageColumns(productId);
}

// ─── attachMultipleMediaToProduct ─────────────────────────────

/**
 * Attach multiple media items to a product in one operation.
 * Skips items already linked. First new item becomes main if product has no main yet.
 */
export async function attachMultipleMediaToProduct(
  productId: string,
  mediaIds: string[],
  options?: { mainMediaId?: string },
): Promise<ProductMedia[]> {
  if (mediaIds.length === 0) return getProductMedia(productId);

  const supabase = getSupabase();
  const uniqueIds = [...new Set(mediaIds)];

  const { data: existingRows } = await supabase
    .from('product_media')
    .select('media_id, role')
    .eq('product_id', productId);

  const existingIds = new Set((existingRows ?? []).map((r) => r.media_id));
  const hasMain = (existingRows ?? []).some((r) => r.role === 'main_image');
  const toAdd = uniqueIds.filter((id) => !existingIds.has(id));

  if (toAdd.length === 0) return getProductMedia(productId);

  const preferredMain = options?.mainMediaId && toAdd.includes(options.mainMediaId)
    ? options.mainMediaId
    : toAdd[0];

  let mainAssigned = hasMain;

  for (const mediaId of toAdd) {
    if (!mainAssigned && mediaId === preferredMain) {
      await setMainProductImage(productId, mediaId);
      mainAssigned = true;
    } else {
      await addGalleryImage(productId, mediaId);
    }
  }

  return getProductMedia(productId);
}

// ─── setProductMediaOrder ─────────────────────────────────────

/**
 * Set the full product image group: first ID = main_image, rest = gallery_image.
 * Removes any product_media rows not in the list.
 */
export async function setProductMediaOrder(
  productId: string,
  orderedMediaIds: string[],
): Promise<ProductMedia[]> {
  const uniqueOrdered = [...new Set(orderedMediaIds)];
  const supabase = getSupabase();

  const { data: currentRows } = await supabase
    .from('product_media')
    .select('media_id')
    .eq('product_id', productId);

  const orderedSet = new Set(uniqueOrdered);
  for (const row of currentRows ?? []) {
    if (!orderedSet.has(row.media_id)) {
      await removeMediaFromProduct(productId, row.media_id);
    }
  }

  if (uniqueOrdered.length === 0) {
    await syncProductImageColumns(productId);
    return [];
  }

  const [mainMediaId, ...galleryMediaIds] = uniqueOrdered;
  await setMainProductImage(productId, mainMediaId);

  // Demote previous main if it is now in gallery positions
  for (let i = 0; i < galleryMediaIds.length; i++) {
    const mediaId = galleryMediaIds[i];
    const sortOrder = (i + 1) * 10;

    const { data: row } = await supabase
      .from('product_media')
      .select('id, role')
      .eq('product_id', productId)
      .eq('media_id', mediaId)
      .maybeSingle();

    if (row?.role === 'gallery_image') {
      await supabase
        .from('product_media')
        .update({ sort_order: sortOrder, updated_at: new Date().toISOString() })
        .eq('id', row.id);
    } else if (!row) {
      await attachMediaToProduct({
        productId,
        mediaId,
        role: 'gallery_image',
        sortOrder,
      });
    }
  }

  // Remove gallery rows that are no longer in the ordered list (except main)
  const gallerySet = new Set(galleryMediaIds);
  const { data: galleryRows } = await supabase
    .from('product_media')
    .select('id, media_id')
    .eq('product_id', productId)
    .eq('role', 'gallery_image');

  for (const row of galleryRows ?? []) {
    if (!gallerySet.has(row.media_id)) {
      await removeMediaFromProduct(productId, row.media_id);
    }
  }

  await syncProductImageColumns(productId);
  return getProductMedia(productId);
}

// ─── syncMediaUsage ───────────────────────────────────────────

async function syncMediaUsage(mediaId: string, productId: string, role: ProductMediaRole): Promise<void> {
  const supabase = getSupabase();

  const usedAs = role;

  await supabase
    .from('media_usages')
    .upsert(
      {
        media_id: mediaId,
        used_in_type: 'product',
        used_in_id: productId,
        used_as: usedAs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'media_id,used_in_type,used_in_id,used_as' },
    );
}

// ─── syncProductImageColumns (backward compat) ────────────────

/**
 * Keeps products.image and products.images in sync with product_media rows
 * so the existing storefront (product/[slug]/page.tsx) keeps working.
 * Exported so it can be called from media-service backfill utilities.
 */
export async function syncProductImageColumns(productId: string): Promise<void> {
  const supabase = getSupabase();

  const { data: rows } = await supabase
    .from('product_media')
    .select('role, sort_order, media_id, media_items(public_url)')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (!rows) return;

  type JoinRow = { role: string; sort_order: number; media_id: string; media_items: unknown };

  const getPublicUrlFromJoin = (r: JoinRow): string | null => {
    const mi = r.media_items;
    if (!mi) return null;
    if (Array.isArray(mi)) return (mi[0] as { public_url?: string | null })?.public_url ?? null;
    return (mi as { public_url?: string | null }).public_url ?? null;
  };

  const mainRow = (rows as unknown as JoinRow[]).find((r) => r.role === 'main_image');
  const galleryRows = (rows as unknown as JoinRow[]).filter((r) => r.role === 'gallery_image');

  const mainUrl = mainRow ? getPublicUrlFromJoin(mainRow) : null;
  const galleryUrls = galleryRows
    .map((r) => getPublicUrlFromJoin(r))
    .filter((u): u is string => u !== null);

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (mainUrl !== undefined) updatePayload.image = mainUrl;
  updatePayload.images = galleryUrls;

  await supabase.from('products').update(updatePayload).eq('id', productId);
}

// ─── backfillProductMedia ─────────────────────────────────────

/**
 * For products that were created before the media library existed:
 * reads products.image / products.images, finds matching media_items by
 * public_url, and creates missing product_media rows.
 * Safe to call multiple times — skips URLs already in product_media.
 * Returns { created } count of new rows inserted.
 */
export async function backfillProductMedia(productId: string): Promise<{ created: number }> {
  const supabase = getSupabase();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, image, images')
    .eq('id', productId)
    .single();

  if (!product) return { created: 0 };

  const urlList: { url: string; role: 'main_image' | 'gallery_image'; sortOrder: number }[] = [];
  if (product.image) urlList.push({ url: product.image, role: 'main_image', sortOrder: 0 });
  for (let i = 0; i < (product.images?.length ?? 0); i++) {
    if (product.images[i] && product.images[i] !== product.image) {
      urlList.push({ url: product.images[i], role: 'gallery_image', sortOrder: (i + 1) * 10 });
    }
  }

  if (urlList.length === 0) return { created: 0 };

  const { data: mediaItems } = await supabase
    .from('media_items')
    .select('id, public_url, storage_path')
    .eq('status', 'active');

  const index = buildMediaUrlIndex(mediaItems ?? []);
  const orderedMediaIds: string[] = [];
  const seen = new Set<string>();

  for (const entry of urlList) {
    const mediaId = resolveMediaIdFromUrl(entry.url, index);
    if (!mediaId || seen.has(mediaId)) continue;
    seen.add(mediaId);
    orderedMediaIds.push(mediaId);
  }

  if (orderedMediaIds.length === 0) return { created: 0 };

  const { data: existingPM } = await supabase
    .from('product_media')
    .select('media_id')
    .eq('product_id', productId);

  const beforeCount = existingPM?.length ?? 0;

  const { data: productsFolder } = await supabase
    .from('media_folders')
    .select('id')
    .eq('slug', DEFAULT_FOLDER_SLUGS.products)
    .maybeSingle();

  if (productsFolder?.id) {
    await supabase
      .from('media_items')
      .update({ folder_id: productsFolder.id, updated_at: new Date().toISOString() })
      .in('id', orderedMediaIds)
      .neq('folder_id', productsFolder.id);
  }

  await setProductMediaOrder(productId, orderedMediaIds);

  for (let i = 0; i < orderedMediaIds.length; i++) {
    const role = i === 0 ? 'main_image' : 'gallery_image';
    await syncMediaUsage(orderedMediaIds[i], productId, role as ProductMediaRole);
  }

  const { data: afterPM } = await supabase
    .from('product_media')
    .select('media_id')
    .eq('product_id', productId);

  const afterCount = afterPM?.length ?? 0;

  return { created: Math.max(0, afterCount - beforeCount) };
}

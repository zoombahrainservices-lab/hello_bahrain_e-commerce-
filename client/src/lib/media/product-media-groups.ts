import { getSupabase } from '@/lib/db';

export interface ProductMediaGroupSummary {
  productId: string;
  productName: string;
  productSlug: string;
  imageCount: number;
  mainThumbUrl: string | null;
  mainMediaId: string | null;
  updatedAt: string;
}

export interface ProductMediaGroupListResult {
  items: ProductMediaGroupSummary[];
  total: number;
  page: number;
  limit: number;
}

type ProductMediaJoin = {
  id: string;
  role: string;
  sort_order: number;
  media_id: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  updated_at: string;
  image: string | null;
  product_media: ProductMediaJoin[] | null;
};

type MediaItemRow = {
  id: string;
  public_url: string | null;
  status: string;
};

type VariantRow = {
  media_id: string;
  variant: string;
  public_url: string;
};

function thumbFromVariants(
  media: MediaItemRow | undefined,
  variants: VariantRow[],
): string | null {
  if (!media || media.status !== 'active') return null;
  const thumb = variants.find((v) => v.variant === 'thumb');
  if (thumb?.public_url) return thumb.public_url;
  const small = variants.find((v) => v.variant === 'small');
  if (small?.public_url) return small.public_url;
  return media.public_url;
}

function rowToGroup(
  product: ProductRow,
  mediaById: Map<string, MediaItemRow>,
  variantsByMediaId: Map<string, VariantRow[]>,
): ProductMediaGroupSummary | null {
  const mediaRows = (product.product_media ?? []).sort((a, b) => {
    if (a.role === 'main_image') return -1;
    if (b.role === 'main_image') return 1;
    return a.sort_order - b.sort_order;
  });

  const activeRows = mediaRows.filter((pm) => {
    const media = mediaById.get(pm.media_id);
    return media?.status === 'active';
  });

  if (activeRows.length === 0 && !product.image) return null;

  const mainRow =
    activeRows.find((pm) => pm.role === 'main_image') ?? activeRows[0] ?? null;
  const mainMedia = mainRow ? mediaById.get(mainRow.media_id) : undefined;
  const mainVariants = mainRow ? variantsByMediaId.get(mainRow.media_id) ?? [] : [];

  return {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    imageCount: activeRows.length || (product.image ? 1 : 0),
    mainThumbUrl: thumbFromVariants(mainMedia, mainVariants) ?? product.image,
    mainMediaId: mainMedia?.id ?? mainRow?.media_id ?? null,
    updatedAt: product.updated_at,
  };
}

export async function listProductMediaGroups(params: {
  q?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
}): Promise<ProductMediaGroupListResult> {
  const supabase = getSupabase();
  const page = params.page ?? 1;
  const limit = params.limit ?? 48;
  const sort = params.sort ?? 'newest';

  // Products with linked media — used to build a valid PostgREST filter on the
  // parent table (filtering on nested product_media.id in .or() is not supported).
  const { data: mediaLinks } = await supabase
    .from('product_media')
    .select('product_id');

  const productIdsWithMedia = [
    ...new Set((mediaLinks ?? []).map((r) => r.product_id as string)),
  ];

  // Lightweight product query — no nested media_variants join.
  let query = supabase
    .from('products')
    .select(
      `
      id, name, slug, updated_at, image,
      product_media (id, role, sort_order, media_id)
    `,
      { count: 'exact' },
    );

  if (productIdsWithMedia.length > 0) {
    query = query.or(
      `image.not.is.null,id.in.(${productIdsWithMedia.join(',')})`,
    );
  } else {
    query = query.not('image', 'is', null);
  }

  if (params.q?.trim()) {
    query = query.ilike('name', `%${params.q.trim()}%`);
  }

  if (sort === 'name_asc') query = query.order('name', { ascending: true });
  else if (sort === 'name_desc') query = query.order('name', { ascending: false });
  else if (sort === 'oldest') query = query.order('updated_at', { ascending: true });
  else query = query.order('updated_at', { ascending: false });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to list product media groups: ${error.message}`);

  const products = (data ?? []) as ProductRow[];
  const mediaIds = [
    ...new Set(
      products.flatMap((p) => (p.product_media ?? []).map((pm) => pm.media_id)),
    ),
  ];

  const mediaById = new Map<string, MediaItemRow>();
  const variantsByMediaId = new Map<string, VariantRow[]>();

  if (mediaIds.length > 0) {
    const [mediaResult, variantResult] = await Promise.all([
      supabase
        .from('media_items')
        .select('id, public_url, status')
        .in('id', mediaIds),
      supabase
        .from('media_variants')
        .select('media_id, variant, public_url')
        .in('media_id', mediaIds)
        .in('variant', ['thumb', 'small']),
    ]);

    if (mediaResult.error) {
      throw new Error(`Failed to load media items: ${mediaResult.error.message}`);
    }
    if (variantResult.error) {
      throw new Error(`Failed to load media variants: ${variantResult.error.message}`);
    }

    for (const row of (mediaResult.data ?? []) as MediaItemRow[]) {
      mediaById.set(row.id, row);
    }
    for (const row of (variantResult.data ?? []) as VariantRow[]) {
      const list = variantsByMediaId.get(row.media_id) ?? [];
      list.push(row);
      variantsByMediaId.set(row.media_id, list);
    }
  }

  const items = products
    .map((row) => rowToGroup(row, mediaById, variantsByMediaId))
    .filter((g): g is ProductMediaGroupSummary => g !== null);

  return {
    items,
    total: count ?? items.length,
    page,
    limit,
  };
}

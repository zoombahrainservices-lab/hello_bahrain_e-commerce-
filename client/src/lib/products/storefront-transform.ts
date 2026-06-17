import {
  getStorefrontMediaForProducts,
  type StorefrontProductMedia,
} from '@/lib/media/storefront-media-service';
import type { StorefrontImageVariants } from '@/lib/media/storefront-urls';
import { pickCardSrc } from '@/lib/media/storefront-urls';

type DbProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  image: string;
  images: string[] | null;
  in_stock: boolean;
  stock_quantity: number;
  rating: number;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
};

export type StorefrontProduct = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  image: string;
  images: string[];
  imageVariants: StorefrontImageVariants | null;
  galleryVariants: StorefrontImageVariants[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  isFeatured: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
};

function toStorefrontProduct(
  product: DbProduct,
  media?: StorefrontProductMedia
): StorefrontProduct {
  return {
    _id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    category: product.category,
    tags: product.tags ?? [],
    image: pickCardSrc(media?.imageVariants ?? null, product.image),
    images: (product.images ?? []).map((url, i) =>
      pickCardSrc(media?.galleryVariants?.[i] ?? null, url)
    ),
    imageVariants: media?.imageVariants ?? null,
    galleryVariants: media?.galleryVariants ?? [],
    inStock: product.in_stock,
    stockQuantity: product.stock_quantity,
    rating: product.rating,
    isFeatured: product.is_featured,
    isNew: product.is_new,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export async function transformProductsForStorefront(
  products: DbProduct[]
): Promise<StorefrontProduct[]> {
  if (products.length === 0) return [];

  const mediaMap = await getStorefrontMediaForProducts(products.map((p) => p.id));
  return products.map((product) =>
    toStorefrontProduct(product, mediaMap.get(product.id))
  );
}

export async function transformProductForStorefront(
  product: DbProduct
): Promise<StorefrontProduct> {
  const [transformed] = await transformProductsForStorefront([product]);
  return transformed;
}

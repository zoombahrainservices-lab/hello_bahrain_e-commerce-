import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Converts an old Supabase Storage URL to a Cloudflare R2 public URL.
// Supabase URL format:
//   https://<project>.supabase.co/storage/v1/object/public/product-images/<key>
// R2 URL format:
//   https://media.helloonebahrain.com/<key>
function toR2Url(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const r2Base = process.env.R2_PUBLIC_BASE_URL;
  if (!r2Base) return null;

  // Already an R2 URL — nothing to do
  if (url.startsWith(r2Base)) return null;

  // Match Supabase Storage public URL pattern
  const match = url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
  if (!match) return null;

  return `${r2Base}/${match[1]}`;
}

// GET /api/admin/migrate-image-urls?dry=true   — preview changes without saving
// GET /api/admin/migrate-image-urls             — apply changes to DB
export async function GET(request: NextRequest) {
  const dry = request.nextUrl.searchParams.get('dry') === 'true';
  const supabase = getSupabase();

  const report: {
    products: { id: string; field: string; old: string; new: string }[];
    banners:  { id: string; field: string; old: string; new: string }[];
    errors:   string[];
    applied: boolean;
  } = { products: [], banners: [], errors: [], applied: false };

  // --- Products ---
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, image, images');

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  for (const product of products ?? []) {
    // main image
    const newMain = toR2Url(product.image);
    if (newMain) {
      report.products.push({ id: product.id, field: 'image', old: product.image, new: newMain });
    }

    // additional images array
    if (Array.isArray(product.images)) {
      const newImages = product.images.map((img: string) => toR2Url(img) ?? img);
      const changed = newImages.some((img: string, i: number) => img !== product.images[i]);
      if (changed) {
        report.products.push({
          id: product.id,
          field: 'images',
          old: JSON.stringify(product.images),
          new: JSON.stringify(newImages),
        });
      }
    }
  }

  // --- Banners ---
  const { data: banners, error: bErr } = await supabase
    .from('banners')
    .select('id, image');

  if (bErr) {
    return NextResponse.json({ error: bErr.message }, { status: 500 });
  }

  for (const banner of banners ?? []) {
    const newImg = toR2Url(banner.image);
    if (newImg) {
      report.banners.push({ id: banner.id, field: 'image', old: banner.image, new: newImg });
    }
  }

  // --- Apply if not a dry run ---
  if (!dry) {
    // Update each product
    const productUpdates = new Map<string, { image?: string; images?: string[] }>();

    for (const change of report.products) {
      if (!productUpdates.has(change.id)) productUpdates.set(change.id, {});
      const update = productUpdates.get(change.id)!;
      if (change.field === 'image') {
        update.image = change.new;
      } else if (change.field === 'images') {
        update.images = JSON.parse(change.new);
      }
    }

    for (const [id, update] of productUpdates) {
      const { error } = await supabase.from('products').update(update).eq('id', id);
      if (error) report.errors.push(`Product ${id}: ${error.message}`);
    }

    // Update each banner
    for (const change of report.banners) {
      const { error } = await supabase
        .from('banners')
        .update({ image: change.new })
        .eq('id', change.id);
      if (error) report.errors.push(`Banner ${change.id}: ${error.message}`);
    }

    report.applied = true;
  }

  return NextResponse.json({
    dry,
    summary: {
      productsToUpdate: new Set(report.products.map((p) => p.id)).size,
      bannersToUpdate: report.banners.length,
      errors: report.errors.length,
    },
    report,
  });
}

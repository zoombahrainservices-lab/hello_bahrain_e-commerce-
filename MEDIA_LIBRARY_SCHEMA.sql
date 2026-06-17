-- =============================================================
-- MEDIA LIBRARY SCHEMA
-- Run in Supabase Dashboard → SQL Editor
-- =============================================================

-- ─── Enums ───────────────────────────────────────────────────

CREATE TYPE media_status AS ENUM (
  'processing',
  'active',
  'failed',
  'trashed'
);

CREATE TYPE media_variant_type AS ENUM (
  'original',
  'tiny',
  'thumb',
  'xs',
  'small',
  'card',
  'medium',
  'large',
  'xl',
  'hero',
  'svg_preview'
);

CREATE TYPE media_usage_entity_type AS ENUM (
  'product',
  'banner',
  'news',
  'event',
  'category',
  'logo',
  'poster',
  'directory',
  'general'
);

CREATE TYPE product_media_role AS ENUM (
  'main_image',
  'gallery_image',
  'thumbnail',
  'variant_image'
);

-- ─── media_folders ───────────────────────────────────────────

CREATE TABLE media_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed default system folders
INSERT INTO media_folders (name, slug, is_system, sort_order) VALUES
  ('Products',   'products',   true, 10),
  ('Banners',    'banners',    true, 20),
  ('News',       'news',       true, 30),
  ('Events',     'events',     true, 40),
  ('Categories', 'categories', true, 50),
  ('Logos',      'logos',      true, 60),
  ('Posters',    'posters',    true, 70),
  ('Directory',  'directory',  true, 80),
  ('General',    'general',    true, 90);

-- ─── media_items ─────────────────────────────────────────────

CREATE TABLE media_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  folder_id          uuid REFERENCES media_folders(id) ON DELETE SET NULL,

  original_file_name text NOT NULL,
  file_name          text NOT NULL,
  seo_file_name      text,

  mime_type          text NOT NULL,
  extension          text NOT NULL,
  format             text NOT NULL,

  file_size_bytes    bigint NOT NULL,
  width              int,
  height             int,

  alt_text           text,
  title              text,
  caption            text,
  description        text,

  storage_disk       text NOT NULL DEFAULT 'cloudflare_r2',
  storage_bucket     text NOT NULL DEFAULT 'cloudflare',
  storage_path       text NOT NULL,
  public_url         text,

  file_hash          text,
  status             media_status NOT NULL DEFAULT 'processing',

  uploaded_by        uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  deleted_at         timestamptz,
  deleted_by         uuid,

  error_message      text
);

CREATE INDEX media_items_folder_id_idx   ON media_items(folder_id);
CREATE INDEX media_items_status_idx      ON media_items(status);
CREATE INDEX media_items_created_at_idx  ON media_items(created_at DESC);
CREATE INDEX media_items_mime_type_idx   ON media_items(mime_type);
CREATE INDEX media_items_file_hash_idx   ON media_items(file_hash);

CREATE INDEX media_items_search_idx ON media_items USING gin (
  to_tsvector(
    'simple',
    coalesce(original_file_name, '') || ' ' ||
    coalesce(file_name, '')          || ' ' ||
    coalesce(alt_text, '')           || ' ' ||
    coalesce(title, '')              || ' ' ||
    coalesce(caption, '')
  )
);

-- ─── media_variants ──────────────────────────────────────────

CREATE TABLE media_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  media_id        uuid NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,

  variant         media_variant_type NOT NULL,

  width           int,
  height          int,
  file_size_bytes bigint,
  mime_type       text NOT NULL,
  extension       text NOT NULL,
  format          text NOT NULL,

  storage_path    text NOT NULL,
  public_url      text NOT NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(media_id, variant)
);

CREATE INDEX media_variants_media_id_idx ON media_variants(media_id);

-- ─── media_usages ────────────────────────────────────────────

CREATE TABLE media_usages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  media_id        uuid NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,

  used_in_type    media_usage_entity_type NOT NULL,
  used_in_id      uuid NOT NULL,
  used_as         text NOT NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE(media_id, used_in_type, used_in_id, used_as)
);

CREATE INDEX media_usages_media_id_idx ON media_usages(media_id);
CREATE INDEX media_usages_entity_idx   ON media_usages(used_in_type, used_in_id);

-- ─── product_media ───────────────────────────────────────────

CREATE TABLE product_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id    uuid NOT NULL REFERENCES media_items(id) ON DELETE RESTRICT,

  role        product_media_role NOT NULL DEFAULT 'gallery_image',
  sort_order  int NOT NULL DEFAULT 0,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(product_id, media_id, role)
);

CREATE INDEX product_media_product_id_idx  ON product_media(product_id);
CREATE INDEX product_media_media_id_idx    ON product_media(media_id);
CREATE INDEX product_media_sort_order_idx  ON product_media(product_id, sort_order);

-- One main image per product (partial unique index)
CREATE UNIQUE INDEX product_one_main_image_idx
  ON product_media(product_id)
  WHERE role = 'main_image';

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_usages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;

-- Server-side routes use the service role key which bypasses RLS.
-- The public storefront can read active media items and their variants.

CREATE POLICY "Public can read active media items"
  ON media_items FOR SELECT
  USING (status = 'active');

CREATE POLICY "Public can read media variants"
  ON media_variants FOR SELECT
  USING (true);

CREATE POLICY "Public can read media folders"
  ON media_folders FOR SELECT
  USING (true);

CREATE POLICY "Public can read product media"
  ON product_media FOR SELECT
  USING (true);

CREATE POLICY "Public can read media usages"
  ON media_usages FOR SELECT
  USING (true);

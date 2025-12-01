-- Fix image column size limits for base64-encoded images
-- Base64 images can be 10,000+ characters, but VARCHAR(500) only allows 500

-- Products table: Change image from VARCHAR(500) to TEXT
ALTER TABLE products 
  ALTER COLUMN image TYPE TEXT;

-- Banners table: Change image from VARCHAR(500) to TEXT
ALTER TABLE banners 
  ALTER COLUMN image TYPE TEXT;

-- Order items table: Change image from VARCHAR(500) to TEXT
ALTER TABLE order_items 
  ALTER COLUMN image TYPE TEXT;

-- Banners table: Change cta_link from VARCHAR(500) to TEXT (for alignment data storage)
ALTER TABLE banners 
  ALTER COLUMN cta_link TYPE TEXT;


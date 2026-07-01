-- ============================================================
-- Migration: Product Enhancements
-- Adds image support, barcode, brand, category, variants
-- Creates storage bucket for product images
-- Safe: additive only — all new columns are nullable
-- ============================================================

-- ─── 1. New columns on products table ───────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url     text,
  ADD COLUMN IF NOT EXISTS images        jsonb    NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS barcode       text,
  ADD COLUMN IF NOT EXISTS brand         text,
  ADD COLUMN IF NOT EXISTS category      text,
  ADD COLUMN IF NOT EXISTS color         text,
  ADD COLUMN IF NOT EXISTS size          text,
  ADD COLUMN IF NOT EXISTS cost_price_bdt integer NOT NULL DEFAULT 0 CHECK (cost_price_bdt >= 0),
  ADD COLUMN IF NOT EXISTS variants      jsonb    NOT NULL DEFAULT '[]'::jsonb;

-- ─── 2. Indexes for search & filtering ──────────────────────
CREATE INDEX IF NOT EXISTS products_brand_idx    ON public.products (brand);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category);
CREATE INDEX IF NOT EXISTS products_barcode_idx  ON public.products (barcode);

-- ─── 3. Storage bucket for product images ───────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, '{image/png,image/jpeg,image/webp,image/gif}')
ON CONFLICT (id) DO NOTHING;

-- ─── 4. RLS policies for product-images bucket ─────────────
DROP POLICY IF EXISTS "product_images_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete" ON storage.objects;

CREATE POLICY "product_images_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');

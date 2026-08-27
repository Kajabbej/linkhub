-- RUN THIS IN THE SUPABASE SQL EDITOR TO UPDATE THE SCHEMA FOR MVP V1.0

-- 0. Tambah kolom cover_url ke tabel profiles (URL foto sampul dari Supabase Storage)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;


-- 1. Add missing columns to the links table & update icon column to TEXT to support 1:1 image upload URLs
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS description VARCHAR(255),
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS badge VARCHAR(20),
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Social Media',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update column type if icon was previously created as VARCHAR(50)
ALTER TABLE links ALTER COLUMN icon TYPE TEXT;


-- 2. Optional: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_links ON links;
CREATE TRIGGER set_timestamp_links
BEFORE UPDATE ON links
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 3. Create Indexes for Search Performance Optimization
CREATE INDEX IF NOT EXISTS idx_links_title ON links(title);
CREATE INDEX IF NOT EXISTS idx_links_description ON links(description);
CREATE INDEX IF NOT EXISTS idx_links_order_no ON links(order_no);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);

-- 4. Add views_count column to profiles table for Visitor statistics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- 5. Tabel log untuk melacak trafik pengunjung harian (7 hari terakhir)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat indeks agar query pencarian rentang tanggal lebih cepat
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id_viewed_at ON profile_views(profile_id, viewed_at);


-- 6. Recreate/Update Banners table structure to support the full Banner Module PRD
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS banner_settings CASCADE;
DROP TYPE IF EXISTS background_type_enum CASCADE;
DROP TYPE IF EXISTS image_position_enum CASCADE;
DROP TYPE IF EXISTS transition_enum CASCADE;

-- Create Enums
CREATE TYPE background_type_enum AS ENUM ('image', 'gradient', 'solid');
CREATE TYPE image_position_enum AS ENUM ('left', 'center', 'right');
CREATE TYPE transition_enum AS ENUM ('fade', 'slide', 'zoom');

-- Create banners table
CREATE TABLE banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(100),
  description VARCHAR(255),
  image_url TEXT,
  image_alt VARCHAR(100) NOT NULL,
  background_type background_type_enum DEFAULT 'solid'::background_type_enum,
  background_color VARCHAR(10) DEFAULT '#0F172A',
  gradient_from VARCHAR(10),
  gradient_to VARCHAR(10),
  image_position image_position_enum DEFAULT 'center'::image_position_enum,
  overlay_opacity SMALLINT DEFAULT 20, -- 0, 20, 40, 60, 80
  button_text VARCHAR(30),
  button_url TEXT,
  open_in_new_tab BOOLEAN DEFAULT true,
  click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  order_no INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create banner_settings table
CREATE TABLE banner_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  autoplay BOOLEAN DEFAULT true,
  interval SMALLINT DEFAULT 5, -- 3, 5, 7, 10
  transition transition_enum DEFAULT 'fade'::transition_enum,
  show_navigation BOOLEAN DEFAULT true,
  show_indicator BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Indexes
CREATE INDEX idx_banners_user ON banners(user_id);
CREATE INDEX idx_banners_order ON banners(order_no);
CREATE INDEX idx_banners_active ON banners(user_id, is_active);
CREATE INDEX idx_banner_settings_user ON banner_settings(user_id);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DROP TRIGGER IF EXISTS set_timestamp_banners ON banners;
CREATE TRIGGER set_timestamp_banners
BEFORE UPDATE ON banners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_banner_settings ON banner_settings;
CREATE TRIGGER set_timestamp_banner_settings
BEFORE UPDATE ON banner_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();




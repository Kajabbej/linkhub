-- RUN THIS IN THE SUPABASE SQL EDITOR TO UPDATE THE SCHEMA FOR MVP V1.0

-- 1. Add missing columns to the links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS description VARCHAR(255),
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS badge VARCHAR(20),
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Social Media',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

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



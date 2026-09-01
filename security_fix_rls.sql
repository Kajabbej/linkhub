-- ================================================================
-- SECURITY FIX: Enable RLS + Policies untuk semua tabel publik
-- Project: linkhub | Dibuat: 2026-09-02
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ================================================================


-- ================================================================
-- 1. TABEL: users
-- Masalah: RLS disabled + kolom 'password' terekspos ke publik!
-- ================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Hanya user yang sedang login (berdasarkan email) yang bisa baca data dirinya sendiri
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (email = auth.email());

-- Hanya user sendiri yang bisa update data dirinya
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (email = auth.email())
WITH CHECK (email = auth.email());

-- Insert hanya boleh dari server (tidak ada policy SELECT publik)
-- Ini mencegah siapapun baca tabel users tanpa login


-- ================================================================
-- 2. TABEL: profiles
-- Masalah: RLS disabled — siapapun bisa baca/edit semua profil
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Siapapun boleh BACA profil (halaman bio-link publik)
DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
USING (true);

-- Hanya pemilik yang bisa UPDATE profilnya
DROP POLICY IF EXISTS "Owner can update own profile" ON profiles;
CREATE POLICY "Owner can update own profile"
ON profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Hanya pemilik yang bisa INSERT profil miliknya
DROP POLICY IF EXISTS "Owner can insert own profile" ON profiles;
CREATE POLICY "Owner can insert own profile"
ON profiles FOR INSERT
WITH CHECK (user_id = auth.uid());


-- ================================================================
-- 3. TABEL: links
-- Masalah: RLS disabled — siapapun bisa baca/edit/hapus semua link
-- ================================================================

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Siapapun boleh BACA links (untuk tampilan bio-link publik)
DROP POLICY IF EXISTS "Public can view links" ON links;
CREATE POLICY "Public can view links"
ON links FOR SELECT
USING (true);

-- Hanya pemilik yang bisa tambah/edit/hapus linknya sendiri
DROP POLICY IF EXISTS "Owner can manage own links" ON links;
CREATE POLICY "Owner can manage own links"
ON links FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ================================================================
-- 4. TABEL: categories
-- Masalah: RLS disabled
-- ================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Siapapun boleh baca kategori (untuk filter/tampilan)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories"
ON categories FOR SELECT
USING (true);


-- ================================================================
-- 5. TABEL: login_logs
-- Masalah: RLS disabled — log login semua user terekspos!
-- ================================================================

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Siapapun boleh INSERT log (diperlukan saat login gagal sekalipun)
DROP POLICY IF EXISTS "Anyone can insert login log" ON login_logs;
CREATE POLICY "Anyone can insert login log"
ON login_logs FOR INSERT
WITH CHECK (true);

-- Hanya admin (berdasarkan email match) yang bisa baca log loginnya sendiri
DROP POLICY IF EXISTS "Owner can view own login logs" ON login_logs;
CREATE POLICY "Owner can view own login logs"
ON login_logs FOR SELECT
USING (email = auth.email());


-- ================================================================
-- 6. TABEL: banners (dari schema.sql kamu sebelumnya)
-- ================================================================

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view banners" ON banners;
CREATE POLICY "Public can view banners"
ON banners FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owner can manage own banners" ON banners;
CREATE POLICY "Owner can manage own banners"
ON banners FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ================================================================
-- 7. TABEL: banner_settings
-- ================================================================

ALTER TABLE banner_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view banner settings" ON banner_settings;
CREATE POLICY "Public can view banner settings"
ON banner_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owner can manage own banner settings" ON banner_settings;
CREATE POLICY "Owner can manage own banner settings"
ON banner_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ================================================================
-- 8. TABEL: profile_views
-- ================================================================

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert profile views" ON profile_views;
CREATE POLICY "Public can insert profile views"
ON profile_views FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Owner can view own profile views" ON profile_views;
CREATE POLICY "Owner can view own profile views"
ON profile_views FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);


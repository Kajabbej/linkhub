"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/auth";
import Image from "next/image";

interface BannerItem {
  id: string;
  title: string;
  description: string | null;
  image: string;
  created_at: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchBanners = useCallback(async () => {
    try {
      const user = getAdminUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("banners")
        .select("id, title, description, image, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error("Gagal mengambil data banner:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;

    setIsSubmitting(true);
    try {
      const user = getAdminUser();
      if (!user) return;

      const { error } = await supabase.from("banners").insert({
        user_id: user.id,
        title,
        description: description || null,
        image: imageUrl,
      });

      if (error) throw error;

      setTitle("");
      setDescription("");
      setImageUrl("");
      fetchBanners();
    } catch (err) {
      alert("Gagal menambahkan banner. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      setBanners(banners.filter((b) => b.id !== id));
    } catch (err) {
      alert("Gagal menghapus banner. Silakan coba lagi.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kelola Banner</h1>
        <p className="text-muted-foreground mt-1">
          Tambahkan banner promosi atau informasi yang akan tampil di halaman publik Anda.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form Add Banner */}
        <Card className="lg:col-span-1 border-black/5 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Tambah Banner Baru</CardTitle>
            <CardDescription>Masukkan rincian tautan gambar untuk carousel banner.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBanner} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Judul Banner</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Promo Akhir Tahun"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Deskripsi Singkat</label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon hingga 70% seluruh item"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">URL Gambar (Image URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/90 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Simpan Banner
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* List Banners */}
        <Card className="lg:col-span-2 border-black/5 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Banner Aktif ({banners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Memuat banner...</p>
              </div>
            ) : banners.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-muted-foreground border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <ImageIcon className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm">Belum ada banner aktif.</p>
                <p className="text-xs opacity-60 max-w-sm mt-1">
                  Banner akan ditampilkan sebagai carousel slider di halaman bio link publik Anda.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="relative group border rounded-2xl overflow-hidden shadow-sm bg-slate-50 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[21/9] w-full bg-slate-200">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-full shadow-md transition-all hover:scale-105"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-3.5 space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{banner.title}</h4>
                      {banner.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{banner.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

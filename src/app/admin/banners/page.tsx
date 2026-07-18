"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Image as ImageIcon, Plus, Trash2, Loader2, AlertCircle, 
  ArrowUp, ArrowDown, ExternalLink, Settings, Eye, Edit2, 
  Sliders, Paintbrush, FileImage, LayoutGrid, CheckCircle2, XCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/auth";
import Image from "next/image";

interface BannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  image_alt: string;
  background_type: "image" | "gradient" | "solid";
  background_color: string;
  gradient_from: string | null;
  gradient_to: string | null;
  image_position: "left" | "center" | "right";
  overlay_opacity: number;
  button_text: string | null;
  button_url: string | null;
  open_in_new_tab: boolean;
  click_count: number;
  last_clicked_at: string | null;
  order_no: number;
  is_active: boolean;
  created_at: string;
}

interface BannerSettings {
  autoplay: boolean;
  interval: number;
  transition: "fade" | "slide" | "zoom";
  show_navigation: boolean;
  show_indicator: boolean;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState<BannerSettings>({
    autoplay: true,
    interval: 5,
    transition: "fade",
    show_navigation: true,
    show_indicator: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [backgroundType, setBackgroundType] = useState<"image" | "gradient" | "solid">("solid");
  const [backgroundColor, setBackgroundColor] = useState("#0F172A");
  const [gradientFrom, setGradientFrom] = useState("#4F46E5");
  const [gradientTo, setGradientTo] = useState("#EC4899");
  const [imagePosition, setImagePosition] = useState<"left" | "center" | "right">("center");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(20);
  const [isActive, setIsActive] = useState(true);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const user = getAdminUser();
      if (!user) return;

      // 1. Fetch Banners
      const { data, error } = await supabase
        .from("banners")
        .select("id, title, subtitle, description, image_url, image_alt, background_type, background_color, gradient_from, gradient_to, image_position, overlay_opacity, button_text, button_url, open_in_new_tab, click_count, last_clicked_at, order_no, is_active, created_at")
        .eq("user_id", user.id)
        .order("order_no", { ascending: true });

      if (error) throw error;
      setBanners(data || []);

      // 2. Fetch Banner Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("banner_settings")
        .select("autoplay, interval, transition, show_navigation, show_indicator")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!settingsError && settingsData) {
        setGlobalSettings({
          autoplay: settingsData.autoplay ?? true,
          interval: settingsData.interval ?? 5,
          transition: (settingsData.transition as any) ?? "fade",
          show_navigation: settingsData.show_navigation ?? true,
          show_indicator: settingsData.show_indicator ?? true
        });
      }
    } catch (err) {
      console.error("Gagal mengambil data banner:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Convert files to WebP client-side
  const convertToWebP = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context tidak didukung."));
            return;
          }

          // Max resolution for horizontal landscape banners
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Gagal mengonversi gambar ke Blob."));
            },
            "image/webp",
            0.85 // quality
          );
        };
        img.onerror = () => reject(new Error("Gagal membaca gambar."));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Gagal membaca file."));
      reader.readAsDataURL(file);
    });
  };

  const handleUploadImage = async (file: File): Promise<string> => {
    const user = getAdminUser();
    if (!user) throw new Error("Akses ditolak");

    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Ukuran berkas melebihi batas 2 MB");
    }

    setUploadProgress("Mengompresi ke WebP...");
    const webpBlob = await convertToWebP(file);
    
    setUploadProgress("Mengunggah gambar...");
    const uuid = typeof crypto.randomUUID === "function" 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const fileName = `${user.id}/${uuid}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(fileName, webpBlob, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("banners")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setImageAlt("");
    setImageUrl("");
    setButtonText("");
    setButtonUrl("");
    setOpenInNewTab(true);
    setBackgroundType("solid");
    setBackgroundColor("#0F172A");
    setGradientFrom("#4F46E5");
    setGradientTo("#EC4899");
    setImagePosition("center");
    setOverlayOpacity(20);
    setIsActive(true);
    setSelectedFile(null);
    setUploadProgress(null);
    setEditingBannerId(null);
  };

  const loadBannerToEdit = (banner: BannerItem) => {
    setEditingBannerId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setDescription(banner.description || "");
    setImageAlt(banner.image_alt || "");
    setImageUrl(banner.image_url || "");
    setButtonText(banner.button_text || "");
    setButtonUrl(banner.button_url || "");
    setOpenInNewTab(banner.open_in_new_tab);
    setBackgroundType(banner.background_type);
    setBackgroundColor(banner.background_color);
    setGradientFrom(banner.gradient_from || "#4F46E5");
    setGradientTo(banner.gradient_to || "#EC4899");
    setImagePosition(banner.image_position);
    setOverlayOpacity(banner.overlay_opacity);
    setIsActive(banner.is_active);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageAlt) {
      alert("Judul dan Alt Teks gambar wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(null);
    try {
      const user = getAdminUser();
      if (!user) return;

      let finalImageUrl = imageUrl;
      
      // Upload file if selected
      if (selectedFile) {
        finalImageUrl = await handleUploadImage(selectedFile);
      }

      if (backgroundType === "image" && !finalImageUrl) {
        throw new Error("Gambar wajib diunggah jika tipe latar belakang adalah Image");
      }

      const bannerData = {
        user_id: user.id,
        title,
        subtitle: subtitle || null,
        description: description || null,
        image_url: finalImageUrl || null,
        image_alt: imageAlt,
        background_type: backgroundType,
        background_color: backgroundColor,
        gradient_from: backgroundType === "gradient" ? gradientFrom : null,
        gradient_to: backgroundType === "gradient" ? gradientTo : null,
        image_position: imagePosition,
        overlay_opacity: overlayOpacity,
        button_text: buttonText || null,
        button_url: buttonUrl || null,
        open_in_new_tab: openInNewTab,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (editingBannerId) {
        // Edit banner
        const { error } = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", editingBannerId);

        if (error) throw error;
      } else {
        // Add new banner, determine order_no
        const nextOrderNo = banners.length > 0 ? Math.max(...banners.map(b => b.order_no)) + 1 : 1;
        const { error } = await supabase
          .from("banners")
          .insert({
            ...bannerData,
            order_no: nextOrderNo
          });

        if (error) throw error;
      }

      resetForm();
      fetchBanners();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan banner. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) return;

    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      setBanners(banners.filter((b) => b.id !== id));
      if (editingBannerId === id) resetForm();
    } catch (err) {
      alert("Gagal menghapus banner. Silakan coba lagi.");
    }
  };

  const handleToggleActive = async (banner: BannerItem) => {
    try {
      const updatedStatus = !banner.is_active;
      const { error } = await supabase
        .from("banners")
        .update({ is_active: updatedStatus })
        .eq("id", banner.id);

      if (error) throw error;
      
      setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: updatedStatus } : b));
    } catch (err) {
      alert("Gagal memperbarui status banner.");
    }
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    try {
      const currentBanner = banners[index];
      const targetBanner = banners[targetIndex];

      const currentOrder = currentBanner.order_no;
      const targetOrder = targetBanner.order_no;

      // Swap order_no in database
      const update1 = supabase
        .from("banners")
        .update({ order_no: targetOrder })
        .eq("id", currentBanner.id);

      const update2 = supabase
        .from("banners")
        .update({ order_no: currentOrder })
        .eq("id", targetBanner.id);

      const [res1, res2] = await Promise.all([update1, update2]);

      if (res1.error || res2.error) throw new Error("Gagal menyimpan urutan baru.");

      // Re-fetch banners to update local state in sorted order
      fetchBanners();
    } catch (err) {
      alert("Gagal mengatur urutan banner.");
    }
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsSubmitting(true);

    try {
      const user = getAdminUser();
      if (!user) return;

      const { error } = await supabase
        .from("banner_settings")
        .upsert({
          user_id: user.id,
          autoplay: globalSettings.autoplay,
          interval: globalSettings.interval,
          transition: globalSettings.transition,
          show_navigation: globalSettings.show_navigation,
          show_indicator: globalSettings.show_indicator,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });

      if (error) throw error;
      alert("Pengaturan slider global berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan pengaturan slider global.");
    } finally {
      setIsSettingsSubmitting(false);
    }
  };

  // Inline styling builder for live preview
  const getPreviewBackgroundStyle = () => {
    if (backgroundType === "solid") {
      return { backgroundColor };
    }
    if (backgroundType === "gradient") {
      return { backgroundImage: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` };
    }
    if (backgroundType === "image" && (imageUrl || selectedFile)) {
      const src = selectedFile ? URL.createObjectURL(selectedFile) : imageUrl;
      return { 
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      };
    }
    return { backgroundColor: "#0F172A" };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kelola Banner</h1>
          <p className="text-muted-foreground mt-1">
            Visualisasikan promosi utama, portofolio, dan CTA di halaman profil Anda.
          </p>
        </div>
        {editingBannerId && (
          <button
            onClick={resetForm}
            className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all cursor-pointer"
          >
            Batal Ubah / Tambah Baru
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Banner Form Panel - Left/Center */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-black/5 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Sliders className="h-5 w-5 text-slate-800" />
              <CardTitle className="text-lg">
                {editingBannerId ? "Edit Banner" : "Tambah Banner Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBanner} className="space-y-5">
                
                {/* Section Content */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Konten</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Judul Banner *</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Contoh: Asus Vivobook Pro"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Sub-Judul</label>
                      <input
                        type="text"
                        maxLength={100}
                        placeholder="Contoh: Affiliate Laptop Kerja"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Deskripsi Singkat</label>
                    <textarea
                      maxLength={255}
                      rows={2}
                      placeholder="Contoh: Miliki sekarang dengan performa tangguh AMD Ryzen dan panel OLED memukau."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Section Background & Image */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Desain & Latar Belakang</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Tipe Latar Belakang</label>
                      <select
                        value={backgroundType}
                        onChange={(e) => setBackgroundType(e.target.value as any)}
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                      >
                        <option value="solid">Warna Solid</option>
                        <option value="gradient">Gradasi Warna</option>
                        <option value="image">Gambar Penuh</option>
                      </select>
                    </div>

                    {backgroundType === "solid" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Pilih Warna</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200"
                          />
                        </div>
                      </div>
                    )}

                    {backgroundType === "gradient" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Warna Awal (From)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={gradientFrom}
                              onChange={(e) => setGradientFrom(e.target.value)}
                              className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={gradientFrom}
                              onChange={(e) => setGradientFrom(e.target.value)}
                              className="w-full text-sm px-2 py-2 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Warna Akhir (To)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={gradientTo}
                              onChange={(e) => setGradientTo(e.target.value)}
                              className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={gradientTo}
                              onChange={(e) => setGradientTo(e.target.value)}
                              className="w-full text-sm px-2 py-2 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Gambar Cover (Max 2MB)</label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Alternatif Teks Gambar (Alt Text) *</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Contoh: Cover Asus Vivobook Pro OLED"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Posisi Gambar (Desktop Layout)</label>
                      <select
                        value={imagePosition}
                        onChange={(e) => setImagePosition(e.target.value as any)}
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                      >
                        <option value="left">Sisi Kiri (Left Layout)</option>
                        <option value="center">Ditengah (Overlay Center)</option>
                        <option value="right">Sisi Kanan (Right Layout)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Kegelapan Overlay</label>
                      <select
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                      >
                        <option value={0}>0% (Tanpa Gelap)</option>
                        <option value={20}>20% (Subtil)</option>
                        <option value={40}>40% (Sedang)</option>
                        <option value={60}>60% (Cukup Gelap)</option>
                        <option value={80}>80% (Sangat Gelap)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section Action Button CTA */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Call To Action (CTA)</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Teks Tombol CTA</label>
                      <input
                        type="text"
                        maxLength={30}
                        placeholder="Contoh: Beli Sekarang"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Link Tujuan CTA</label>
                      <input
                        type="text"
                        placeholder="Contoh: https://shopee.co.id/..."
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="openInNewTab"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                      className="rounded border-slate-300 text-black focus:ring-black cursor-pointer h-4 w-4"
                    />
                    <label htmlFor="openInNewTab" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Buka tautan di tab baru (Target _blank)
                    </label>
                  </div>
                </div>

                {/* Section Toggle Active */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-800">Aktifkan Banner</label>
                    <p className="text-[11px] text-slate-400">Tentukan apakah banner ini langsung tampil atau tidak.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-5 w-5 text-black border-slate-300 rounded focus:ring-black cursor-pointer"
                  />
                </div>

                {/* Error Upload / Compressing Progress */}
                {uploadProgress && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <Loader2 size={16} className="animate-spin" />
                    {uploadProgress}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black/90 active:scale-95 disabled:opacity-50 transition-all mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan Banner...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {editingBannerId ? "Ubah Banner" : "Simpan Banner Baru"}
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Global Slider Settings Form */}
          <Card className="border-black/5 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Settings className="h-5 w-5 text-slate-800" />
              <CardTitle className="text-lg">Pengaturan Slider Global</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGlobalSettings} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Interval Pergantian (Detik)</label>
                    <select
                      value={globalSettings.interval}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, interval: Number(e.target.value) }))}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                    >
                      <option value={3}>3 Detik</option>
                      <option value={5}>5 Detik</option>
                      <option value={7}>7 Detik</option>
                      <option value={10}>10 Detik</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Animasi Transisi</label>
                    <select
                      value={globalSettings.transition}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, transition: e.target.value as any }))}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                    >
                      <option value="fade">Fade (Pudar)</option>
                      <option value="slide" disabled>Slide (Slide-in - V2)</option>
                      <option value="zoom" disabled>Zoom (Zoom-in - V2)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800">Autoplay</span>
                      <p className="text-[10px] text-slate-400">Putar otomatis</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={globalSettings.autoplay}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, autoplay: e.target.checked }))}
                      className="h-4 w-4 text-black border-slate-300 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800">Navigasi Panah</span>
                      <p className="text-[10px] text-slate-400">Tombol kanan & kiri</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={globalSettings.show_navigation}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, show_navigation: e.target.checked }))}
                      className="h-4 w-4 text-black border-slate-300 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800">Dot Indikator</span>
                      <p className="text-[10px] text-slate-400">Bulatan indikator bawah</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={globalSettings.show_indicator}
                      onChange={(e) => setGlobalSettings(prev => ({ ...prev, show_indicator: e.target.checked }))}
                      className="h-4 w-4 text-black border-slate-300 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSettingsSubmitting}
                  className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 active:scale-95 disabled:opacity-50 transition-all mt-1"
                >
                  {isSettingsSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan Pengaturan...
                    </>
                  ) : (
                    "Simpan Pengaturan Slider"
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel & Lists - Right */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Preview */}
          <Card className="border-black/5 shadow-sm bg-white overflow-hidden sticky top-6">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Eye className="h-5 w-5 text-slate-800" />
              <CardTitle className="text-lg">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                style={getPreviewBackgroundStyle()}
                className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-slate-200 transition-all duration-300 flex flex-col justify-end p-4 text-white shadow-inner"
              >
                {/* Semi-transparan Overlay */}
                <div 
                  style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})` }}
                  className="absolute inset-0 transition-all duration-300"
                />

                {/* Cover Image rendering on side on desktop layout */}
                {backgroundType !== "image" && (imageUrl || selectedFile) && (
                  <div className={`absolute top-2 bottom-2 max-w-[45%] flex items-center justify-center overflow-hidden rounded-xl border border-white/10 ${
                    imagePosition === "left" ? "left-2" : imagePosition === "right" ? "right-2" : "hidden"
                  }`}>
                    <img 
                      src={selectedFile ? URL.createObjectURL(selectedFile) : imageUrl}
                      alt={imageAlt || "Preview Cover"}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Content Overlay */}
                <div className={`relative z-10 w-full flex flex-col justify-end ${
                  imagePosition === "left" && backgroundType !== "image" && (imageUrl || selectedFile) ? "pl-[50%] text-left" :
                  imagePosition === "right" && backgroundType !== "image" && (imageUrl || selectedFile) ? "pr-[50%] text-left" :
                  "text-center items-center"
                }`}>
                  <span className="text-[9px] font-bold tracking-widest text-pink-400 uppercase drop-shadow-md">
                    {subtitle || "SUB TITLE BANNER"}
                  </span>
                  <h4 className="text-sm font-black mt-0.5 leading-tight drop-shadow-md">
                    {title || "Judul Utama Banner"}
                  </h4>
                  <p className="text-[10px] text-white/80 line-clamp-1 mt-0.5 font-light leading-snug max-w-sm drop-shadow-sm">
                    {description || "Deskripsi singkat mengenai promo atau penawaran banner ini."}
                  </p>
                  
                  {buttonText && (
                    <div className="mt-2">
                      <span className="inline-flex items-center justify-center bg-white text-black font-bold text-[9px] px-3.5 py-1.5 rounded-full shadow hover:scale-105 transition-all">
                        {buttonText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">
                * Tampilan layout responsif dan interaksi transisi dinamis disimulasikan sesuai dengan pengaturan Anda.
              </p>
            </CardContent>
          </Card>

          {/* List of Active & Inactive Banners */}
          <Card className="border-black/5 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Daftar Banner ({banners.length})</CardTitle>
              <CardDescription>Atur urutan dengan menekan panah naik/turun.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-36 flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mb-1" />
                  <p className="text-xs">Memuat daftar banner...</p>
                </div>
              ) : banners.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center text-muted-foreground border border-dashed border-slate-200 rounded-2xl p-4 text-center">
                  <ImageIcon className="h-7 w-7 opacity-20 mb-1" />
                  <p className="text-xs font-semibold">Belum ada banner.</p>
                  <p className="text-[10px] opacity-60 mt-0.5 max-w-xs">
                    Gunakan formulir disamping untuk menambahkan promosi/hero section pertama Anda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`relative border rounded-2xl p-3 flex items-center justify-between gap-3 transition-all ${
                        banner.is_active ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50 border-slate-200/60 opacity-70"
                      } ${editingBannerId === banner.id ? "ring-2 ring-black border-transparent" : ""}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        
                        {/* Thumbnail background color or cover image */}
                        <div 
                          style={
                            banner.background_type === "image" && banner.image_url
                              ? { backgroundImage: `url(${banner.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                              : banner.background_type === "gradient"
                              ? { backgroundImage: `linear-gradient(135deg, ${banner.gradient_from}, ${banner.gradient_to})` }
                              : { backgroundColor: banner.background_color }
                          }
                          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden"
                        >
                          {banner.background_type !== "image" && banner.image_url ? (
                            <Image 
                              src={banner.image_url} 
                              alt="thumb" 
                              width={24} 
                              height={24} 
                              unoptimized
                              className="object-cover h-6 w-6 rounded"
                            />
                          ) : banner.background_type === "image" ? null : (
                            <Paintbrush className="h-4 w-4 text-white/50" />
                          )}
                        </div>

                        <div className="overflow-hidden flex-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                            {banner.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              banner.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                            }`}>
                              {banner.is_active ? "Aktif" : "Non-aktif"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {banner.click_count || 0} klik
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls and Actions */}
                      <div className="flex items-center gap-1.5">
                        
                        {/* Reorder Arrows */}
                        <div className="flex flex-col gap-0.5 border-r pr-1.5 border-slate-100">
                          <button
                            onClick={() => handleReorder(index, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition-colors"
                            title="Pindah keatas"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => handleReorder(index, "down")}
                            disabled={index === banners.length - 1}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 transition-colors"
                            title="Pindah kebawah"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>

                        {/* Edit and Delete Action Buttons */}
                        <button
                          onClick={() => loadBannerToEdit(banner)}
                          className="p-1.5 bg-slate-50 hover:bg-black hover:text-white rounded-lg text-slate-600 transition-all"
                          title="Edit banner"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className={`p-1.5 rounded-lg transition-all ${
                            banner.is_active 
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                          title={banner.is_active ? "Deaktifkan" : "Aktifkan"}
                        >
                          {banner.is_active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-600 text-slate-700 hover:text-white rounded-lg transition-all"
                          title="Hapus banner"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

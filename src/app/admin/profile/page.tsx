"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Smartphone, 
  MapPin, 
  Save, 
  Loader2, 
  Upload, 
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  ImageIcon
} from "lucide-react";

// Custom inline SVG icons matching premium Flaticon style with official colors
const Instagram = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <i 
    className={`fi fi-brands-instagram ${className} flex items-center justify-center shrink-0`} 
    style={{ fontSize: size, width: size, height: size, minWidth: size, minHeight: size, color: '#E1306C' }} 
  />
);

const Facebook = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <i 
    className={`fi fi-brands-facebook ${className} flex items-center justify-center shrink-0`} 
    style={{ fontSize: size, width: size, height: size, minWidth: size, minHeight: size, color: '#1877F2' }} 
  />
);

const WhatsApp = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <i 
    className={`fi fi-brands-whatsapp ${className} flex items-center justify-center shrink-0`} 
    style={{ fontSize: size, width: size, height: size, minWidth: size, minHeight: size, color: '#25D366' }} 
  />
);

const TikTok = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <i 
    className={`fi fi-brands-tik-tok ${className} flex items-center justify-center shrink-0`} 
    style={{ fontSize: size, width: size, height: size, minWidth: size, minHeight: size }} 
  />
);

const Tokopedia = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    fill="none"
    className={`${className} shrink-0 aspect-square`}
    style={{ width: size, height: size, minWidth: size, minHeight: size }}
  >
    <rect width="40" height="40" rx="10" fill="#42B549" />
    <circle cx="15" cy="20" r="4.2" fill="white" />
    <circle cx="15" cy="20" r="1.8" fill="#42B549" />
    <circle cx="25" cy="20" r="4.2" fill="white" />
    <circle cx="25" cy="20" r="1.8" fill="#42B549" />
    <path d="M20 21l-1.5 2.5h3L20 21z" fill="#FFC107" />
    <circle cx="10" cy="22" r="1.5" fill="#FF8A80" />
    <circle cx="30" cy="22" r="1.5" fill="#FF8A80" />
  </svg>
);

const Shopee = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    fill="none"
    className={`${className} shrink-0 aspect-square`}
    style={{ width: size, height: size, minWidth: size, minHeight: size }}
  >
    <rect width="40" height="40" rx="10" fill="#EE4D2D" />
    <path d="M20 10c-3 0-5 2.5-5 5.5v1.5h10v-1.5c0-3-2-5.5-5-5.5z" stroke="white" strokeWidth="2" fill="none" />
    <path d="M12 16h16l1.5 13.5a1.5 1.5 0 01-1.5 1.5H12a1.5 1.5 0 01-1.5-1.5L12 16z" fill="white" />
    <path d="M18 20.5c0-.8.7-1.5 1.5-1.5h2c.8 0 1.5.7 1.5 1.5v1c0 .8-.7 1.5-1.5 1.5h-1c-.8 0-1.5.7-1.5 1.5v1c0 .8.7 1.5 1.5 1.5h2c.8 0 1.5-.7 1.5-1.5" stroke="#EE4D2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Schema validasi form
const profileSchema = zod.object({
  username: zod.string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  fullname: zod.string().min(1, "Nama Lengkap wajib diisi"),
  bio: zod.string().max(200, "Bio maksimal 200 karakter").optional().or(zod.literal("")),
  whatsapp_number: zod.string().optional().or(zod.literal("")),
  location: zod.string().optional().or(zod.literal("")),
  instagram_url: zod.string().optional().or(zod.literal("")),
  tiktok_url: zod.string().optional().or(zod.literal("")),
  facebook_url: zod.string().optional().or(zod.literal("")),
});

type ProfileFormValues = zod.infer<typeof profileSchema>;

interface UserLink {
  id: string;
  title: string;
  url: string;
  is_active: boolean;
}

// --- Helper: compress image via Canvas → Blob ---
function compressImageToBlob(
  file: File,
  opts: { maxWidth: number; maxHeight: number; quality: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const ratio = Math.min(opts.maxWidth / img.width, opts.maxHeight / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        opts.quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userLinks, setUserLinks] = useState<UserLink[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      fullname: "",
      bio: "",
      whatsapp_number: "",
      location: "",
      instagram_url: "",
      tiktok_url: "",
      facebook_url: "",
    },
  });

  // Watch fields for live preview
  const watchedUsername = watch("username");
  const watchedFullname = watch("fullname");
  const watchedBio = watch("bio");
  const watchedLocation = watch("location");
  const watchedWhatsapp = watch("whatsapp_number");
  const watchedInstagram = watch("instagram_url");
  const watchedTiktok = watch("tiktok_url");
  const watchedFacebook = watch("facebook_url");

  const handleCopyLink = () => {
    const usernameVal = watchedUsername || "budistore";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const fullUrl = `${origin}/${usernameVal.toLowerCase()}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch profile and active links
  const loadProfileAndLinks = useCallback(async (uid: string) => {
    try {
      // 1. Fetch Profile
      const { data: profile, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      if (pError) throw pError;

      if (profile) {
        setValue("username", profile.username || "");
        setValue("fullname", profile.fullname || "");
        setValue("bio", profile.bio || "");
        setValue("whatsapp_number", profile.whatsapp_number || "");
        setValue("location", profile.location || "");
        setValue("instagram_url", profile.instagram_url || "");
        setValue("tiktok_url", profile.tiktok_url || "");
        setValue("facebook_url", profile.facebook_url || "");
        if (profile.avatar_url) {
          setAvatarBase64(profile.avatar_url);
        }
        if (profile.cover_url) {
          setCoverUrl(profile.cover_url);
        }
      } else {
        // Fallback default values
        setValue("fullname", "Budi Store");
        setValue("username", "budistore");
      }

      // 2. Fetch User Links for Mobile Mockup
      const { data: links, error: lError } = await supabase
        .from("links")
        .select("id, title, url, is_active")
        .eq("user_id", uid)
        .eq("is_active", true)
        .order("order_no", { ascending: true });

      if (lError) throw lError;
      setUserLinks(links || []);
    } catch (err) {
      console.error("Gagal mengambil data profil:", err);
      setErrorMessage("Gagal memuat data profil. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [setValue]);

  useEffect(() => {
    const user = getAdminUser();
    if (!user) {
      router.push("/masuk-admin-rahasia");
      return;
    }
    setUserId(user.id);
    loadProfileAndLinks(user.id);
  }, [router, loadProfileAndLinks]);

  // Handle avatar upload, compress to 200x200px client-side to reduce DB size and improve load times by 100x
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ukuran file maksimal adalah 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 200; // Perfect size for circular avatar mockup
          canvas.width = size;
          canvas.height = size;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Draw image cropped in a square/center
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;
            
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            
            // Compress to JPEG with 0.8 quality -> drops size to ~10KB-15KB!
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
            setAvatarBase64(compressedBase64);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cover upload: validate → compress → upload to Supabase Storage → save URL
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File harus berupa gambar.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ukuran file sampul maksimal 10MB.");
      return;
    }

    setIsUploadingCover(true);
    setErrorMessage(null);
    try {
      const blob = await compressImageToBlob(file, { maxWidth: 1000, maxHeight: 400, quality: 0.8 });

      // Gunakan Supabase Auth UID (auth.uid()) untuk path — harus cocok dengan RLS policy
      const { data: { session } } = await supabase.auth.getSession();
      const authUid = session?.user?.id;
      if (!authUid) throw new Error("Sesi Google tidak ditemukan. Coba login ulang.");

      const filePath = `${authUid}/cover-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("covers").getPublicUrl(filePath);
      setCoverUrl(data.publicUrl);
    } catch (err: unknown) {
      console.error("Gagal mengunggah foto sampul:", err);
      setErrorMessage("Gagal mengunggah foto sampul. Coba lagi.");
    } finally {
      setIsUploadingCover(false);
      // reset input value so user can re-upload same file
      e.target.value = "";
    }
  };

  // Handle cover delete: remove from Storage bucket + set null in DB
  const handleDeleteCover = async () => {
    if (!coverUrl || !userId) return;
    setIsUploadingCover(true);
    try {
      // Extract path from public URL (everything after /public/covers/)
      const pathMatch = coverUrl.match(/public\/covers\/(.+)/);
      if (pathMatch?.[1]) {
        await supabase.storage.from("covers").remove([decodeURIComponent(pathMatch[1])]);
      }
      setCoverUrl(null);
      // Immediately persist null to DB
      if (userId) {
        await supabase.from("profiles").update({ cover_url: null }).eq("user_id", userId);
      }
    } catch (err) {
      console.error("Gagal menghapus foto sampul:", err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!userId) return;
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const profileData = {
        user_id: userId,
        username: values.username.toLowerCase(),
        fullname: values.fullname,
        bio: values.bio || null,
        avatar_url: avatarBase64 || null,
        cover_url: coverUrl,
        whatsapp_number: values.whatsapp_number || null,
        location: values.location || null,
        instagram_url: values.instagram_url || null,
        tiktok_url: values.tiktok_url || null,
        facebook_url: values.facebook_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (error) {
        if (error.message?.includes("username_key")) {
          setErrorMessage("Username sudah digunakan oleh akun lain.");
        } else {
          throw error;
        }
      } else {
        setSuccessMessage("Profil Anda berhasil diperbarui!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      let msg = "Terjadi kesalahan";
      if (err) {
        if (err.message) {
          msg = err.message;
        } else if (err.details) {
          msg = err.details;
        } else if (typeof err === 'object') {
          try {
            msg = JSON.stringify(err);
            if (msg === "{}") {
              // Standard Error objects have non-enumerable properties, try keys
              const props = Object.getOwnPropertyNames(err);
              const obj: any = {};
              props.forEach(p => {
                obj[p] = err[p];
              });
              msg = JSON.stringify(obj);
            }
          } catch (e) {
            msg = String(err);
          }
        } else {
          msg = String(err);
        }
      }
      console.error("Gagal memperbarui profil:", msg);
      setErrorMessage(`Gagal memperbarui profil: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] flex-col items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-sm">Memuat halaman profil...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 pb-10">
      
      {/* Kolom Kiri: Form Edit */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kelola Profil</h1>
          <p className="text-muted-foreground mt-1">Atur identitas digital dan informasi publik Anda.</p>
        </div>

        {/* Copy Link Widget */}
        <Card className="border-black/5 bg-slate-50/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Link Bio Anda</span>
              <span className="text-sm font-semibold text-slate-800 break-all select-all block">
                {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/{watchedUsername || "budistore"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                copied 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                  : "bg-black text-white hover:bg-slate-800"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Tersalin!" : "Salin Link"}
            </button>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-black/5 shadow-md bg-white">
            <CardContent className="pt-6 space-y-6">

              {/* Cover Photo Upload */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={15} />
                  Foto Sampul
                </h3>
                <div className="relative w-full aspect-[21/8] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 group">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt="Cover Preview"
                      fill
                      sizes="600px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <ImageIcon size={28} className="opacity-40" />
                      <span className="text-xs">Belum ada foto sampul</span>
                    </div>
                  )}
                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm">
                      {isUploadingCover ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {isUploadingCover ? "Mengunggah..." : "Unggah Sampul"}
                      <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" disabled={isUploadingCover} />
                    </label>
                    {coverUrl && (
                      <button
                        type="button"
                        onClick={handleDeleteCover}
                        disabled={isUploadingCover}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 shadow-sm disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Gambar akan dikompresi ke ukuran optimal (~1000×400px). Maks 10MB.</p>
              </div>

              {/* Avatar Upload */}
              <div className="flex items-center gap-6 pb-2 border-t border-slate-100 pt-4">
                <div className="relative group flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                  {avatarBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={avatarBase64} 
                      alt="Avatar Preview" 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">
                      {watchedFullname?.charAt(0) || "B"}
                    </span>
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                    <Upload size={18} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Foto Profil</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    File foto akan dikompresi otomatis agar pemuatan profil instan.
                  </p>
                  <label className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/5 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    <Upload size={12} />
                    Pilih File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold text-slate-600">Username Link</Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm text-slate-400 select-none">@</span>
                    <Input 
                      id="username" 
                      placeholder="budistore" 
                      className="pl-7" 
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-500">{errors.username.message}</p>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-xs font-bold text-slate-600">Nama Lengkap / Toko</Label>
                  <Input 
                    id="fullname" 
                    placeholder="Budi Store" 
                    {...register("fullname")}
                  />
                  {errors.fullname && (
                    <p className="text-xs text-red-500">{errors.fullname.message}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-bold text-slate-600">Bio Singkat</Label>
                <textarea 
                  id="bio" 
                  placeholder="Ceritakan tentang diri atau toko Anda..." 
                  className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-xs text-red-500">{errors.bio.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number" className="text-xs font-bold text-slate-600">No. WhatsApp Bisnis</Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400"><WhatsApp size={16} /></span>
                    <Input 
                      id="whatsapp_number" 
                      placeholder="Contoh: 62812345678" 
                      className="pl-10" 
                      {...register("whatsapp_number")}
                    />
                  </div>
                </div>

                {/* Lokasi */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-xs font-bold text-slate-600">Lokasi / Kota</Label>
                  <Input 
                    id="location" 
                    placeholder="Contoh: Jakarta, Indonesia" 
                    {...register("location")}
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Media Sosial (Opsional)</h3>
                
                <div className="space-y-3">
                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <Label htmlFor="instagram_url" className="text-xs text-slate-500">Instagram Username</Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400"><Instagram size={16} /></span>
                      <Input 
                        id="instagram_url" 
                        placeholder="contoh: budistore.id" 
                        className="pl-10" 
                        {...register("instagram_url")}
                      />
                    </div>
                  </div>

                  {/* Tiktok */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tiktok_url" className="text-xs text-slate-500">TikTok Username</Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400"><TikTok size={16} /></span>
                      <Input 
                        id="tiktok_url" 
                        placeholder="contoh: budistore" 
                        className="pl-10" 
                        {...register("tiktok_url")}
                      />
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <Label htmlFor="facebook_url" className="text-xs text-slate-500">Facebook URL</Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-400"><Facebook size={16} /></span>
                      <Input 
                        id="facebook_url" 
                        placeholder="contoh: https://facebook.com/budistore" 
                        className="pl-10" 
                        {...register("facebook_url")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Alert */}
              {successMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-800">
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-3 text-sm font-semibold shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Perubahan
                  </>
                )}
              </button>

            </CardContent>
          </Card>
        </form>
      </div>

      {/* Kolom Kanan: Live Preview Mockup HP */}
      <div className="lg:col-span-5 flex flex-col items-center justify-start pt-10 lg:pt-20">
        <div className="sticky top-24 w-full max-w-[320px]">
          <p className="text-xs font-semibold text-slate-500 text-center mb-3 flex items-center justify-center gap-1.5">
            <Smartphone size={14} />
            Live Preview (Simulasi HP)
          </p>
          
          {/* Phone Frame Mockup */}
          <div className="relative mx-auto h-[600px] w-[295px] overflow-hidden rounded-[38px] border-[8px] border-slate-900 bg-slate-950 shadow-2xl">
            {/* Camera Notch */}
            <div className="absolute top-2 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full bg-slate-900 z-30" />
            
            {/* Screen Content */}
            <div className="h-full w-full overflow-y-auto bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#122239] to-slate-950 text-white flex flex-col items-center justify-between text-center select-none">

              {/* Cover Photo Mockup */}
              <div className="relative w-full h-[90px] shrink-0 overflow-hidden">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt="Cover Mockup"
                    fill
                    sizes="295px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50" />
                )}
                {/* Dark gradient fade at bottom for avatar overlap */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>

              {/* Floating Glassmorphic Card Container — starts below cover */}
              <div className="relative w-full mx-0 px-3 pt-10 pb-4 -mt-6 rounded-t-[28px] bg-white/5 backdrop-blur-xl border-t border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center flex-1">
                
                {/* Overlapping Avatar Container */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-1.5 rounded-full border border-white/10 bg-slate-950/90 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                  {/* Concentric rings */}
                  <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-pulse pointer-events-none" />
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-slate-800 flex items-center justify-center">
                    {avatarBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={avatarBase64} 
                        alt="Mockup Avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <span className="text-xl font-bold bg-gradient-to-tr from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        {watchedFullname?.charAt(0).toUpperCase() || "B"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fullname Mockup */}
                <h2 className="text-sm font-bold tracking-tight text-white mb-0.5 mt-1 font-sans">
                  {watchedFullname || "Budi Store"}
                </h2>

                {/* Username Mockup */}
                <p className="text-[10px] text-slate-400/80 mb-3">
                  @{watchedUsername || "budistore"}
                </p>

                {/* Bio Mockup */}
                {watchedBio && (
                  <p className="text-[11px] text-slate-300/90 font-light leading-relaxed max-w-[200px] mb-3 line-clamp-3">
                    {watchedBio}
                  </p>
                )}

                {/* Location Mockup */}
                {watchedLocation && (
                  <p className="text-[9px] text-slate-400 flex items-center gap-1.5 mb-4">
                    <MapPin size={10} className="text-purple-400" />
                    {watchedLocation}
                  </p>
                )}

                {/* Social Media Link Icons Mockup */}
                {(watchedWhatsapp || watchedInstagram || watchedTiktok || watchedFacebook) && (
                  <div className="flex items-center justify-center gap-4 mb-5">
                    {watchedWhatsapp && (
                      <div className="text-slate-400 p-0.5">
                        <WhatsApp size={16} />
                      </div>
                    )}
                    {watchedInstagram && (
                      <div className="text-slate-400 p-0.5">
                        <Instagram size={16} />
                      </div>
                    )}
                    {watchedTiktok && (
                      <div className="text-slate-400 p-0.5">
                        <TikTok size={15} />
                      </div>
                    )}
                    {watchedFacebook && (
                      <div className="text-slate-400 p-0.5">
                        <Facebook size={16} />
                      </div>
                    )}
                  </div>
                )}

                {/* User Active Links Mockup */}
                <div className="w-full flex flex-col gap-2.5">
                  {userLinks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-white/5 bg-white/5 text-[9px] text-slate-500">
                      <LinkIcon size={12} className="mb-1 opacity-40" />
                      Belum ada link aktif
                    </div>
                  ) : (
                    userLinks.map((link) => {
                      const lowerUrl = link.url.toLowerCase();
                      let icon = <ExternalLink size={10} className="text-slate-400" />;
                      if (lowerUrl.includes("tokopedia")) {
                        icon = <Tokopedia size={18} />;
                      } else if (lowerUrl.includes("shopee")) {
                        icon = <Shopee size={18} />;
                      } else if (lowerUrl.includes("wa.me") || lowerUrl.includes("whatsapp")) {
                        icon = <WhatsApp size={18} />;
                      } else if (lowerUrl.includes("instagram.com")) {
                        icon = <Instagram size={18} />;
                      } else if (lowerUrl.includes("tiktok.com")) {
                        icon = <TikTok size={18} />;
                      } else if (lowerUrl.includes("facebook.com")) {
                        icon = <Facebook size={18} />;
                      }
                      
                      return (
                        <div 
                          key={link.id} 
                          className="w-full rounded-xl bg-[#1a4a60]/85 border border-[#2d6f8f]/30 p-1.5 text-[10px] font-semibold text-white flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center justify-center w-6 h-6 shrink-0">
                            {icon}
                          </div>
                          <span className="truncate text-center flex-1 px-2">{link.title}</span>
                          <div className="w-6 shrink-0" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer Slug Link */}
              <div className="pt-4 pb-1 text-[9px] tracking-widest text-slate-500 uppercase font-semibold">
                Powered by <span className="text-purple-400 font-bold">LinkHub</span>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

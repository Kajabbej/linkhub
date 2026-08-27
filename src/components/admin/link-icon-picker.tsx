"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Image as ImageIcon, Trash2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DynamicIcon } from "./dynamic-icon";
import { AVAILABLE_ICONS } from "./add-link-modal";

interface LinkIconPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Crop image to exact 1:1 square aspect ratio via Canvas
 */
function cropAndCompressToSquare(file: File, size = 250): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context tidak tersedia."));
        return;
      }

      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Gagal memotong gambar."))),
        "image/webp",
        0.88
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function LinkIconPicker({ value, onChange, disabled = false }: LinkIconPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "preset">(() => {
    if (
      value &&
      (value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:") ||
        value.startsWith("/"))
    ) {
      return "upload";
    }
    return "upload"; // Default to 1:1 image upload as requested
  });

  const isCustomImage =
    value &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:") ||
      value.startsWith("/"));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File harus berupa gambar (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Ukuran gambar maksimal 10MB.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Get current auth session user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authUid = session?.user?.id || "guest";

      const isGif = file.type === "image/gif";
      let uploadBlob: Blob;
      let contentType: string;
      let ext: string;

      if (isGif) {
        uploadBlob = file;
        contentType = "image/gif";
        ext = "gif";
      } else {
        // Crop & compress to 1:1 square WebP (250x250)
        uploadBlob = await cropAndCompressToSquare(file, 250);
        contentType = "image/webp";
        ext = "webp";
      }

      // Try uploading to Supabase Storage "covers" bucket
      const filePath = `${authUid}/link-icon-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(filePath, uploadBlob, { contentType, upsert: true });

      if (uploadError) {
        console.warn("Storage upload failed, using Data URL fallback:", uploadError);
        // Fallback: convert to base64 Data URL if storage fails or RLS issue
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            onChange(evt.target.result as string);
          }
        };
        reader.readAsDataURL(uploadBlob);
      } else {
        const { data } = supabase.storage.from("covers").getPublicUrl(filePath);
        onChange(data.publicUrl);
      }
    } catch (err: any) {
      console.error("Error processing icon image:", err);
      setErrorMessage("Gagal memproses gambar. Coba lagi.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    onChange("Link"); // Reset to default Lucide Link icon
  };

  return (
    <div className="space-y-3">
      {/* Header Tabs */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <ImageIcon size={14} className="text-slate-500" />
          Icon Link
        </label>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Upload Gambar (1:1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preset")}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "preset"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Icon Standar
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-100">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab 1: Upload Gambar (1:1 Ratio) */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          {isCustomImage ? (
            /* Selected Custom 1:1 Image Preview Card */
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="relative group shrink-0">
                <div className="h-16 w-16 aspect-square overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value}
                    alt="Preview Icon 1:1"
                    className="h-full w-full object-cover aspect-square"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow-xs">
                  1:1
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">Gambar Rasio 1:1</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  Tersimpan & siap ditampilkan di halaman bio
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-black text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Ganti Gambar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={disabled || isUploading}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Dropzone Box */
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center ${
                isUploading
                  ? "border-slate-300 bg-slate-50"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-400"
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin mb-1.5 text-black" />
                  <span className="text-xs font-medium">Memotong ke rasio 1:1...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="flex h-10 w-10 aspect-square items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 text-slate-700 mb-2">
                    <Upload size={18} />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Klik untuk unggah gambar <span className="text-purple-600 font-bold">(Rasio 1:1)</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Otomatis dipotong persegi 1:1. PNG, JPG, WEBP, GIF max 10MB.
                  </p>
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
        </div>
      )}

      {/* Tab 2: Icon Standar (Lucide Icons Grid) */}
      {activeTab === "preset" && (
        <div className="grid grid-cols-7 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-[140px] overflow-y-auto">
          {AVAILABLE_ICONS.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-all ${
                value === iconName
                  ? "bg-black text-white scale-105 shadow-sm"
                  : "bg-white border border-slate-100 text-slate-600 hover:bg-slate-100"
              }`}
              title={iconName}
            >
              <DynamicIcon name={iconName} size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

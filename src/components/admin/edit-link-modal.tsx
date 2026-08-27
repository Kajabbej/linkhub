"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { DynamicIcon } from "./dynamic-icon";
import { AVAILABLE_ICONS } from "./add-link-modal";

import { LinkIconPicker } from "./link-icon-picker";

// Form validation schema
const linkSchema = zod.object({
  title: zod.string()
    .min(1, "Judul link wajib diisi")
    .max(100, "Judul maksimal 100 karakter"),
  description: zod.string()
    .max(255, "Deskripsi maksimal 255 karakter")
    .optional()
    .or(zod.literal("")),
  url: zod.string()
    .min(1, "URL wajib diisi")
    .url("Format URL tidak valid (harus diawali http:// atau https://)"),
  category: zod.enum(["Social Media", "Affiliate", "Marketplace", "Portfolio", "Contact"]),
  badge: zod.string().optional().or(zod.literal("")),
  icon: zod.string().min(1, "Icon wajib dipilih atau diunggah"),
});

type LinkFormValues = zod.infer<typeof linkSchema>;

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  link: {
    id: string;
    title: string;
    description?: string | null;
    url: string;
    category?: string | null;
    badge?: string | null;
    icon?: string | null;
  } | null;
}

const AVAILABLE_BADGES = ["NEW", "HOT", "PROMO", "BEST"];

export function EditLinkModal({ isOpen, onClose, onSuccess, link }: EditLinkModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("Link");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      category: "Social Media",
      badge: "",
      icon: "Link",
    },
  });

  // Load link details when modal opens
  useEffect(() => {
    if (link) {
      setValue("title", link.title);
      setValue("description", link.description || "");
      setValue("url", link.url);
      setValue("category", (link.category as any) || "Social Media");
      setValue("badge", link.badge || "");
      
      const currentIcon = link.icon || "Link";
      setValue("icon", currentIcon);
      setSelectedIcon(currentIcon);
      
      setErrorMessage(null);
    }
  }, [link, setValue]);

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    setValue("icon", iconName, { shouldValidate: true });
  };

  const onSubmit = async (values: LinkFormValues) => {
    if (!link) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Update link in Supabase links table
      const { error } = await supabase
        .from("links")
        .update({
          title: values.title,
          description: values.description || null,
          url: values.url,
          category: values.category,
          badge: values.badge || null,
          icon: values.icon,
        })
        .eq("id", link.id);

      if (error) {
        throw error;
      }

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage("Gagal memperbarui link. Pastikan Anda sudah menjalankan SQL schema update di Supabase editor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white/95 backdrop-blur-xl border border-black/5 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black mb-2 overflow-hidden">
            <DynamicIcon name={selectedIcon} size={20} />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">Edit Link</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Perbarui data detail link Anda di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Icon Picker (Supports 1:1 Image Upload & Preset Icons) */}
          <LinkIconPicker
            value={selectedIcon}
            onChange={handleIconSelect}
            disabled={isLoading}
          />
          {errors.icon && (
            <p className="text-xs font-medium text-red-500">{errors.icon.message}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Category Select */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-xs font-semibold text-slate-700">
                Kategori
              </Label>
              <select
                id="edit-category"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black/10 outline-none"
                {...register("category")}
              >
                <option value="Social Media">Social Media</option>
                <option value="Affiliate">Affiliate</option>
                <option value="Marketplace">Marketplace</option>
                <option value="Portfolio">Portfolio</option>
                <option value="Contact">Contact</option>
              </select>
            </div>

            {/* Badge Select */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-badge" className="text-xs font-semibold text-slate-700">
                Badge <span className="text-muted-foreground font-normal">(Opsional)</span>
              </Label>
              <select
                id="edit-badge"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-black focus:ring-1 focus:ring-black/10 outline-none"
                {...register("badge")}
              >
                <option value="">Tidak ada</option>
                {AVAILABLE_BADGES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title" className="text-xs font-semibold text-slate-700">
              Judul Link
            </Label>
            <Input
              id="edit-title"
              type="text"
              placeholder="Contoh: Shopee Official Store"
              disabled={isLoading}
              maxLength={100}
              className="rounded-xl border-slate-200 bg-white px-3.5 py-4 text-sm focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs font-medium text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description" className="text-xs font-semibold text-slate-700">
              Deskripsi Singkat <span className="text-muted-foreground font-normal">(Opsional)</span>
            </Label>
            <Input
              id="edit-description"
              type="text"
              placeholder="Contoh: Dapatkan diskon 50% untuk produk kecantikan"
              disabled={isLoading}
              maxLength={255}
              className="rounded-xl border-slate-200 bg-white px-3.5 py-4 text-sm focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs font-medium text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-url" className="text-xs font-semibold text-slate-700">
              URL Link / Affiliate
            </Label>
            <Input
              id="edit-url"
              type="text"
              placeholder="https://shope.ee/..."
              disabled={isLoading}
              className="rounded-xl border-slate-200 bg-white px-3.5 py-4 text-sm focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs font-medium text-red-500 mt-1">{errors.url.message}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium rounded-xl text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-black text-white hover:bg-black/90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

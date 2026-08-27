"use client";

import { useState } from "react";
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
import { getAdminUser } from "@/lib/auth";
import { Loader2, Link as LinkIcon, AlertCircle, HelpCircle } from "lucide-react";
import { DynamicIcon } from "./dynamic-icon";

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

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Popular icons to choose from
export const AVAILABLE_ICONS = [
  "Globe", "Instagram", "Facebook", "Youtube", "Twitter", "Send", "MessageCircle", "Phone", "Mail",
  "ShoppingBag", "ShoppingCart", "Store", "Link", "Heart", "Star", "Flame", "Gift", "Award",
  "FileText", "BookOpen", "Camera", "Video", "Compass", "MapPin", "User", "Coffee", "Briefcase", "FolderOpen"
];

// Available badges
const AVAILABLE_BADGES = ["NEW", "HOT", "PROMO", "BEST"];

export function AddLinkModal({ isOpen, onClose, onSuccess }: AddLinkModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("Link");

  const {
    register,
    handleSubmit,
    reset,
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

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    setValue("icon", iconName, { shouldValidate: true });
  };

  const onSubmit = async (values: LinkFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = getAdminUser();
      if (!user || !user.id) {
        setErrorMessage("Sesi Anda berakhir. Silakan login kembali.");
        setIsLoading(false);
        return;
      }

      // Get current max order_no to append at the end
      const { data: currentLinks } = await supabase
        .from("links")
        .select("order_no")
        .eq("user_id", user.id)
        .order("order_no", { ascending: false })
        .limit(1);

      const nextOrder = currentLinks && currentLinks.length > 0 ? currentLinks[0].order_no + 1 : 1;

      // Insert link into Supabase links table
      const { error } = await supabase
        .from("links")
        .insert({
          user_id: user.id,
          title: values.title,
          description: values.description || null,
          url: values.url,
          category: values.category,
          badge: values.badge || null,
          icon: values.icon,
          order_no: nextOrder,
          is_active: true,
          click_count: 0
        });

      if (error) {
        throw error;
      }

      // Success
      reset();
      setSelectedIcon("Link");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error adding link:", err);
      setErrorMessage(
        err?.message
          ? `Gagal menyimpan link: ${err.message}`
          : "Gagal menyimpan link. Pastikan Anda sudah menjalankan SQL schema update di Supabase editor."
      );
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
          <DialogTitle className="text-xl font-bold text-slate-900">Tambah Link Baru</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Lengkapi formulir di bawah ini untuk menambahkan tautan baru.
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
              <Label htmlFor="category" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Kategori</span>
                <span className="text-[10px] font-bold text-emerald-600 font-['Lato',sans-serif] uppercase tracking-wider">Font: Lato</span>
              </Label>
              <select
                id="category"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-['Lato',sans-serif] font-bold text-slate-800 focus:border-black focus:ring-1 focus:ring-black/10 outline-none"
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
              <Label htmlFor="badge" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Badge <span className="text-muted-foreground font-normal">(Opsional)</span></span>
                <span className="text-[10px] font-black text-sky-500 tracking-wider">Font: Shine</span>
              </Label>
              <select
                id="badge"
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-800 focus:border-black focus:ring-1 focus:ring-black/10 outline-none"
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
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Judul Link
            </Label>
            <Input
              id="title"
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
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Deskripsi Singkat <span className="text-muted-foreground font-normal">(Opsional)</span>
            </Label>
            <Input
              id="description"
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
            <Label htmlFor="url" className="text-xs font-semibold text-slate-700">
              URL Link / Affiliate
            </Label>
            <Input
              id="url"
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
                "Simpan Link"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

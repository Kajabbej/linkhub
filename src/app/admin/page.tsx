"use client";

import { useEffect, useState, useCallback } from "react";
import NextLink from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  MousePointerClick, 
  Link as LinkIcon, 
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Edit2,
  BarChart3,
  Loader2,
  Trash2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AddLinkModal } from "@/components/admin/add-link-modal";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/auth";
import { DynamicIcon } from "@/components/admin/dynamic-icon";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_active: boolean;
  order_no: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  // Fetch links from Supabase
  const fetchLinks = useCallback(async () => {
    try {
      const user = getAdminUser();
      if (!user) return;
      
      setAdminName(user.name);

      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("user_id", user.id)
        .order("order_no", { ascending: true });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error("Gagal mengambil data link:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Handle delete link
  const handleDeleteLink = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus link ini?")) return;

    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update state
      setLinks(links.filter(link => link.id !== id));
    } catch (err) {
      alert("Gagal menghapus link. Silakan coba lagi.");
    }
  };

  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.is_active).length;

  // Stats dummy for visual representation (visitors and conversion will connect later)
  const stats = [
    { title: "Total Visitor", value: "0", change: "0% dari kemarin", icon: Users },
    { title: "Total Klik Link", value: "0", change: "0% dari kemarin", icon: MousePointerClick },
    { title: "Total Link Aktif", value: activeLinks.toString(), change: `Dari total ${totalLinks} link`, icon: LinkIcon },
    { title: "Conversion Rate", value: "0.0%", change: "0.0% dari kemarin", icon: TrendingUp },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8 pb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Selamat pagi, {adminName} 👋</h1>
          <p className="text-muted-foreground mt-1">Berikut adalah performa LinkHub Anda hari ini.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-black/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          + Tambah Link Baru
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="border-black/5 shadow-sm bg-white/60 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-black/5 rounded-lg">
                  <stat.icon className="h-4 w-4 text-black" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-7">
        {/* Main Chart Area (Placeholder) */}
        <Card className="md:col-span-2 lg:col-span-4 border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Trafik Pengunjung (7 Hari Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center flex-col gap-3 text-muted-foreground bg-slate-50/50 m-6 mt-0 rounded-xl border border-dashed border-slate-200">
            <BarChart3 size={48} className="opacity-20" />
            <p className="text-sm">Grafik interaktif akan muncul setelah koneksi Supabase.</p>
          </CardContent>
        </Card>

        {/* Top Performing Links */}
        <Card className="md:col-span-1 lg:col-span-3 border-black/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Daftar Link Anda</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Memuat daftar link...</p>
              </div>
            ) : links.length === 0 ? (
              <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground border border-dashed border-slate-200 rounded-xl">
                <LinkIcon className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-sm">Belum ada link yang ditambahkan.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-black underline underline-offset-4 cursor-pointer"
                >
                  Tambah link sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1">
                {links.map((link) => (
                  <div key={link.id} className="group flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/5 text-black">
                        <DynamicIcon name={link.icon || "Link"} size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {link.title}
                        </p>
                        <a 
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-black transition-colors truncate"
                        >
                          {link.url}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Separator className="my-5 opacity-50" />
            
            <NextLink 
              href="/admin/links" 
              className="block w-full text-center py-2 text-sm font-medium text-muted-foreground hover:text-black transition-colors rounded-lg hover:bg-black/5 cursor-pointer"
            >
              Lihat Semua Link
            </NextLink>
          </CardContent>
        </Card>
      </div>

      {/* Add Link Dialog Modal */}
      <AddLinkModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLinks}
      />
    </motion.div>
  );
}

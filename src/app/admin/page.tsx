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
  click_count?: number;
  created_at: string;
}

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [dailyViews, setDailyViews] = useState<{ date: string; count: number }[]>(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
      return { date: label, count: 0 };
    }).reverse()
  );
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
        .select("id, title, url, icon, is_active, order_no, click_count, created_at")
        .eq("user_id", user.id)
        .order("order_no", { ascending: true });

      if (error) throw error;
      setLinks(data || []);

      // Fetch profile views_count
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, views_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setViewsCount(profileData.views_count || 0);

        // Fetch profile views log for the last 7 days
        const { data: viewsLog, error: viewsError } = await supabase
          .from("profile_views")
          .select("viewed_at")
          .eq("profile_id", profileData.id)
          .order("viewed_at", { ascending: true });

        // Helper to format Date object into local YYYY-MM-DD
        const getLocalDateString = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        // Build last 7 days keys in local timezone
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return getLocalDateString(d);
        }).reverse();

        if (!viewsError && viewsLog) {
          const grouped = last7Days.map(dateStr => {
            const count = viewsLog.filter(view => {
              const viewDateStr = getLocalDateString(new Date(view.viewed_at));
              return viewDateStr === dateStr;
            }).length;

            const [year, month, day] = dateStr.split("-").map(Number);
            const parsedDate = new Date(year, month - 1, day);
            const label = parsedDate.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
            return { date: label, count };
          });
          setDailyViews(grouped);
        } else {
          // Fallback empty
          const fallback = last7Days.map(dateStr => {
            const [year, month, day] = dateStr.split("-").map(Number);
            const parsedDate = new Date(year, month - 1, day);
            const label = parsedDate.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
            return { date: label, count: 0 };
          });
          setDailyViews(fallback);
        }
      }
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
  const totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
  const conversionRate = viewsCount > 0 ? ((totalClicks / viewsCount) * 100).toFixed(1) : "0.0";

  const stats = [
    { title: "Total Visitor", value: viewsCount.toLocaleString(), change: "Pengunjung profil", icon: Users },
    { title: "Total Klik Link", value: totalClicks.toLocaleString(), change: "Total klik semua link", icon: MousePointerClick },
    { title: "Total Link Aktif", value: activeLinks.toString(), change: `Dari total ${totalLinks} link`, icon: LinkIcon },
    { title: "Conversion Rate", value: `${conversionRate}%`, change: "Rasio klik vs pengunjung", icon: TrendingUp },
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
        {/* Main Chart Area */}
        <Card className="md:col-span-2 lg:col-span-4 border-black/5 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Trafik Pengunjung (7 Hari Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-between pt-4">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-sm">Memuat data grafik...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-end">
                {/* Y-axis helper values & Bars container */}
                <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 h-[200px] relative">
                  {dailyViews.map((day, idx) => {
                    const maxVal = Math.max(...dailyViews.map(d => d.count), 1);
                    const percentage = (day.count / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded-md absolute -top-8 shadow-lg pointer-events-none z-10 font-bold whitespace-nowrap">
                          {day.count} pengunjung
                        </div>

                        {/* Dynamic Height Bar */}
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(percentage, 5)}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                          className={`w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-500 group-hover:from-violet-500 group-hover:to-pink-500 shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300 relative flex justify-center`}
                        >
                          {day.count > 0 && (
                            <span className="absolute -top-6 text-[10px] font-bold text-purple-600 group-hover:text-pink-600 transition-colors">
                              {day.count}
                            </span>
                          )}
                        </motion.div>

                        {/* Day label */}
                        <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                          {day.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

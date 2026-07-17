"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MousePointerClick, BarChart3, TrendingUp, Loader2, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/auth";
import { DynamicIcon } from "@/components/admin/dynamic-icon";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  click_count?: number;
}

export default function StatisticsPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [dailyViews, setDailyViews] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const user = getAdminUser();
      if (!user) return;

      // 1. Fetch profiles views
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, views_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setViewsCount(profileData.views_count || 0);

        // 2. Fetch daily traffic log
        const { data: viewsLog, error: viewsError } = await supabase
          .from("profile_views")
          .select("viewed_at")
          .eq("profile_id", profileData.id)
          .order("viewed_at", { ascending: true });

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split("T")[0];
        }).reverse();

        if (!viewsError && viewsLog) {
          const grouped = last7Days.map((dateStr) => {
            const count = viewsLog.filter((view) => {
              const viewDateStr = new Date(view.viewed_at).toISOString().split("T")[0];
              return viewDateStr === dateStr;
            }).length;

            const parsedDate = new Date(dateStr);
            const label = parsedDate.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
            return { date: label, count };
          });
          setDailyViews(grouped);
        }
      }

      // 3. Fetch link clicks
      const { data: linksData } = await supabase
        .from("links")
        .select("id, title, url, icon, click_count")
        .eq("user_id", user.id)
        .order("click_count", { ascending: false });

      setLinks(linksData || []);
    } catch (err) {
      console.error("Gagal mengambil data statistik:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
  const conversionRate = viewsCount > 0 ? ((totalClicks / viewsCount) * 100).toFixed(1) : "0.0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 pb-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analisis & Statistik</h1>
        <p className="text-muted-foreground mt-1">
          Pantau grafik performa klik tautan dan traffic pengunjung profil Anda secara rinci.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm">Memuat data analitik...</p>
        </div>
      ) : (
        <>
          {/* Quick Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-black/5 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Kunjungan Profil</CardTitle>
                <Users size={16} className="text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{viewsCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Akumulasi seluruh pengunjung unik</p>
              </CardContent>
            </Card>

            <Card className="border-black/5 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Klik Tautan</CardTitle>
                <MousePointerClick size={16} className="text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Total klik pada semua tombol link aktif</p>
              </CardContent>
            </Card>

            <Card className="border-black/5 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Conversion Rate</CardTitle>
                <TrendingUp size={16} className="text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Rasio klik per total kunjungan</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Chart */}
            <Card className="lg:col-span-4 border-black/5 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Grafik Trafik (7 Hari Terakhir)</CardTitle>
                <CardDescription>Visualisasi jumlah kunjungan profil Anda sehari-hari.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col justify-end pt-4">
                <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-2 h-[200px] relative">
                  {dailyViews.map((day, idx) => {
                    const maxVal = Math.max(...dailyViews.map((d) => d.count), 1);
                    const percentage = (day.count / maxVal) * 100;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded-md absolute -top-8 shadow-lg pointer-events-none z-10 font-bold whitespace-nowrap">
                          {day.count} pengunjung
                        </div>

                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(percentage, 5)}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                          className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-violet-600 to-indigo-500 group-hover:from-violet-500 group-hover:to-pink-500 shadow-[0_0_15px_rgba(124,58,237,0.15)] transition-all duration-300 relative flex justify-center"
                        >
                          {day.count > 0 && (
                            <span className="absolute -top-6 text-[10px] font-bold text-indigo-600">
                              {day.count}
                            </span>
                          )}
                        </motion.div>

                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-full">
                          {day.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top performing links */}
            <Card className="lg:col-span-3 border-black/5 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Kinerja Tombol Link</CardTitle>
                <CardDescription>Urutan tautan yang paling banyak diklik oleh pengunjung.</CardDescription>
              </CardHeader>
              <CardContent>
                {links.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-muted-foreground italic text-sm">
                    Belum ada data tautan.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {links.map((link, idx) => (
                      <div key={link.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                            <DynamicIcon name={link.icon || "Link"} size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{link.title}</h4>
                            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{link.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-indigo-50/70 border border-indigo-100/50 rounded-full px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                          {link.click_count || 0} klik
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
}

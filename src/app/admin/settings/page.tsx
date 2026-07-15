"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Monitor, 
  Globe, 
  RefreshCw,
  Loader2
} from "lucide-react";

interface LoginLog {
  id: string;
  email: string;
  ip_address: string;
  browser: string;
  device: string;
  status: "SUCCESS" | "FAILED";
  login_at: string;
}

export default function SettingsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("login_logs")
        .select("*")
        .order("login_at", { ascending: false })
        .limit(50); // Get latest 50 logs

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Gagal memuat log aktivitas:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pengaturan</h1>
          <p className="text-muted-foreground mt-1">Keamanan akun dan pantau aktivitas masuk.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isRefreshing}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Segarkan
        </button>
      </div>

      {/* Security Info Banner */}
      <div className="flex gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm text-amber-800 backdrop-blur-md">
        <ShieldAlert size={20} className="shrink-0 text-amber-600 mt-0.5" />
        <div>
          <h3 className="font-semibold">Lindungi Akses Dashboard Anda</h3>
          <p className="text-amber-700/90 mt-0.5">
            Daftar di bawah menunjukkan percobaan masuk ke dashboard admin Anda. Pastikan Anda mengenali setiap alamat IP dan perangkat yang terdaftar di status <strong className="text-emerald-700">SUCCESS</strong>.
          </p>
        </div>
      </div>

      {/* Logs Card */}
      <Card className="border-black/5 shadow-md bg-white/70 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Aktivitas & Log Login</CardTitle>
          <CardDescription>Menampilkan hingga 50 aktivitas login terakhir ke panel admin ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Memuat riwayat login...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center text-slate-400 text-sm">
              Tidak ada riwayat login tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4">Perangkat</th>
                    <th className="py-3.5 px-4">Browser</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4 font-medium text-slate-800">
                        {formatDate(log.login_at)}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {log.email}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono flex items-center gap-1.5">
                        <Globe size={14} className="text-slate-400" />
                        {log.ip_address}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          {log.device === "Android" || log.device === "iOS" ? (
                            <Smartphone size={14} className="text-slate-400" />
                          ) : (
                            <Monitor size={14} className="text-slate-400" />
                          )}
                          {log.device}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {log.browser}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                            <CheckCircle2 size={12} />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-100">
                            <XCircle size={12} />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

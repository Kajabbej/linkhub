"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Link as LinkIcon,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Loader2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Eye,
  MousePointerClick
} from "lucide-react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/auth";
import { DynamicIcon } from "@/components/admin/dynamic-icon";

const AddLinkModal = dynamic(() => import("@/components/admin/add-link-modal").then(mod => mod.AddLinkModal), {
  ssr: false,
  loading: () => null
});

const EditLinkModal = dynamic(() => import("@/components/admin/edit-link-modal").then(mod => mod.EditLinkModal), {
  ssr: false,
  loading: () => null
});

interface LinkItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  icon: string | null;
  badge: string | null;
  category: string | null;
  click_count: number;
  is_active: boolean;
  order_no: number;
  created_at: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchLinks, setSearchLinks] = useState<LinkItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("Semua");

  const searchCacheRef = useRef<Record<string, { timestamp: number; data: LinkItem[] }>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch links from Supabase (normal list)
  const fetchLinks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const user = getAdminUser();
      if (!user) return;

      // Get links ordered by order_no ascending
      const { data, error } = await supabase
        .from("links")
        .select("id, title, description, url, icon, badge, category, click_count, is_active, order_no, created_at")
        .eq("user_id", user.id)
        .order("order_no", { ascending: true });

      if (error) throw error;

      let fetchedLinks = (data || []).map(l => ({
        ...l,
        description: l.description || "",
        badge: l.badge || "",
        category: l.category || "Social Media",
        icon: l.icon || "Link",
        click_count: l.click_count || 0
      }));

      // Self-healing: Check for duplicate order numbers or all set to default 1
      const orders = fetchedLinks.map(l => l.order_no);
      const hasInvalidOrders = orders.length > 0 && (
        new Set(orders).size !== orders.length || orders.every(o => o === 1)
      );

      if (hasInvalidOrders) {
        // Re-index sequentially 1, 2, 3...
        const updates = fetchedLinks.map((link, idx) => ({
          ...link,
          order_no: idx + 1
        }));

        // Update database rows sequentially
        for (const link of updates) {
          await supabase
            .from("links")
            .update({ order_no: link.order_no })
            .eq("id", link.id);
        }
        fetchedLinks = updates;
      }

      setLinks(fetchedLinks);
    } catch (err) {
      console.error("Gagal mengambil data link:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Debounce input keyword
  useEffect(() => {
    const cleanQuery = searchQuery.trim();
    if (cleanQuery.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(cleanQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform database search on debouncedQuery change
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchLinks([]);
      setIsSearchLoading(false);
      return;
    }

    const performSearch = async () => {
      const now = Date.now();
      const cached = searchCacheRef.current[debouncedQuery];

      // Check cache validity (30 seconds)
      if (cached && now - cached.timestamp < 30000) {
        setSearchLinks(cached.data);
        setIsSearchLoading(false);
        return;
      }

      // Cancel previous search request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsSearchLoading(true);
      try {
        const user = getAdminUser();
        if (!user) return;

        const cleanKeyword = debouncedQuery.replace(/%/g, "");

        // Search targeted only on 'title' and 'description'
        const { data, error } = await supabase
          .from("links")
          .select("id, title, description, url, icon, badge, category, click_count, is_active, order_no, created_at")
          .eq("user_id", user.id)
          .or(`title.ilike.%${cleanKeyword}%,description.ilike.%${cleanKeyword}%`)
          .order("order_no", { ascending: true })
          .limit(20)
          .abortSignal(signal);

        if (error) {
          if (error.message && error.message.includes("abort")) {
            return; // Request was aborted, ignore
          }
          throw error;
        }

        const processed = (data || []).map(l => ({
          ...l,
          description: l.description || "",
          badge: l.badge || "",
          category: l.category || "Social Media",
          icon: l.icon || "Link",
          click_count: l.click_count || 0
        }));

        // Cache the search result
        searchCacheRef.current[debouncedQuery] = {
          timestamp: Date.now(),
          data: processed
        };

        if (!signal.aborted) {
          setSearchLinks(processed);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Gagal melakukan pencarian:", err);
        }
      } finally {
        if (!signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery]);

  // Toggle is_active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic UI update
    setLinks(prev => prev.map(link => link.id === id ? { ...link, is_active: newStatus } : link));
    setSearchLinks(prev => prev.map(link => link.id === id ? { ...link, is_active: newStatus } : link));

    try {
      const { error } = await supabase
        .from("links")
        .update({ is_active: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Update cache
      Object.keys(searchCacheRef.current).forEach(key => {
        searchCacheRef.current[key].data = searchCacheRef.current[key].data.map(link =>
          link.id === id ? { ...link, is_active: newStatus } : link
        );
      });
    } catch (err) {
      // Revert UI on error
      setLinks(prev => prev.map(link => link.id === id ? { ...link, is_active: currentStatus } : link));
      setSearchLinks(prev => prev.map(link => link.id === id ? { ...link, is_active: currentStatus } : link));
      alert("Gagal memperbarui status link.");
    }
  };

  // Re-order logic (Up/Down)
  const handleMoveLink = async (index: number, direction: "up" | "down") => {
    // Re-ordering is disabled during active search to prevent misalignment
    if (isSearchActive) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredLinks.length) return;

    const currentLink = filteredLinks[index];
    const targetLink = filteredLinks[targetIndex];

    const currentLinkRealIdx = links.findIndex(l => l.id === currentLink.id);
    const targetLinkRealIdx = links.findIndex(l => l.id === targetLink.id);

    if (currentLinkRealIdx === -1 || targetLinkRealIdx === -1) return;

    const currentOrder = currentLink.order_no;
    const targetOrder = targetLink.order_no;

    // Optimistic UI update on full list
    const updatedLinks = [...links];
    updatedLinks[currentLinkRealIdx] = { ...currentLink, order_no: targetOrder };
    updatedLinks[targetLinkRealIdx] = { ...targetLink, order_no: currentOrder };
    updatedLinks.sort((a, b) => a.order_no - b.order_no);
    setLinks(updatedLinks);

    try {
      const { error: error1 } = await supabase
        .from("links")
        .update({ order_no: targetOrder })
        .eq("id", currentLink.id);

      const { error: error2 } = await supabase
        .from("links")
        .update({ order_no: currentOrder })
        .eq("id", targetLink.id);

      if (error1 || error2) throw new Error("Gagal mengupdate urutan database");
    } catch (err) {
      console.error(err);
      alert("Gagal merubah urutan link. Silakan coba lagi.");
      fetchLinks(); // Revert to server state
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus link ini?")) return;

    // Optimistic UI update
    const originalLinks = [...links];
    const originalSearchLinks = [...searchLinks];

    setLinks(prev => prev.filter(link => link.id !== id));
    setSearchLinks(prev => prev.filter(link => link.id !== id));

    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update cache
      Object.keys(searchCacheRef.current).forEach(key => {
        searchCacheRef.current[key].data = searchCacheRef.current[key].data.filter(link => link.id !== id);
      });
    } catch (err) {
      // Revert UI on error
      setLinks(originalLinks);
      setSearchLinks(originalSearchLinks);
      alert("Gagal menghapus link. Silakan coba lagi.");
    }
  };

  const handleEditClick = (link: LinkItem) => {
    setSelectedLink(link);
    setIsEditModalOpen(true);
  };

  // Choose the active list source
  const isSearchActive = searchQuery.trim().length >= 2;
  const activeLinks = isSearchActive ? searchLinks : links;

  // Filter computation by category
  const filteredLinks = activeLinks.filter((link) => {
    return categoryFilter === "Semua" || link.category === categoryFilter;
  });

  const getBadgeColor = (badgeName: string) => {
    switch (badgeName) {
      case "NEW": return "bg-blue-50 text-blue-700 border-blue-200";
      case "HOT": return "bg-red-50 text-red-700 border-red-200";
      case "PROMO": return "bg-amber-50 text-amber-700 border-amber-200";
      case "BEST": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Beautiful Skeleton Loading Card
  const SkeletonCard = () => (
    <div className="w-full border border-black/5 bg-white/70 backdrop-blur-xl rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="h-6 w-6 bg-slate-200 rounded-md" />
          <div className="h-6 w-6 bg-slate-200 rounded-md" />
        </div>
        <div className="h-2.5 w-2.5 bg-slate-200 rounded-full" />
        <div className="h-12 w-12 bg-slate-200 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-1/6" />
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="h-8 w-20 bg-slate-200 rounded-xl" />
        <div className="h-6 w-12 bg-slate-200 rounded-full" />
        <div className="h-8 w-24 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Kelola Link</h1>
          <p className="text-muted-foreground mt-1">Atur, urutkan, dan pantau seluruh tautan bio Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              searchCacheRef.current = {}; // Clear search cache on refresh
              fetchLinks();
            }}
            disabled={isRefreshing}
            className="inline-flex cursor-pointer items-center justify-center p-2.5 rounded-xl border border-black/5 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
            title="Segarkan data & hapus cache"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            Tambah Link
          </button>
        </div>
      </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white/70 backdrop-blur-xl border border-black/5 p-4 rounded-2xl shadow-sm">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Link berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm rounded-xl border border-slate-200/80 outline-none focus:border-black transition-all"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="w-full sm:w-[200px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm rounded-xl border border-slate-200/80 outline-none focus:border-black transition-all"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Social Media">Social Media</option>
              <option value="Affiliate">Affiliate</option>
              <option value="Marketplace">Marketplace</option>
              <option value="Portfolio">Portfolio</option>
              <option value="Contact">Contact</option>
            </select>
          </div>
        </div>

        {/* Links List */}
        {isLoading || isSearchLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredLinks.length === 0 ? (
          isSearchActive ? (
            /* Empty State Search */
            <div className="flex h-[300px] flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-white/50 backdrop-blur-sm px-6 text-center">
              <Search className="h-12 w-12 opacity-25 mb-4 text-slate-500" />
              <p className="text-base font-bold text-slate-800">Tidak ada link yang sesuai.</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">Silakan gunakan kata kunci lain.</p>
            </div>
          ) : (
            /* Empty State Normal list or filter */
            <div className="flex h-[300px] flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-white/50 backdrop-blur-sm">
              <LinkIcon className="h-12 w-12 opacity-20 mb-3 text-slate-500" />
              <p className="text-base font-medium">Tidak ada link ditemukan</p>
              <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan filter kategori Anda atau tambahkan link baru.</p>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  layoutId={link.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                >
                  <Card className={`border border-black/5 shadow-sm bg-white overflow-hidden transition-all duration-200 ${!link.is_active ? "opacity-60 bg-slate-50/50" : ""}`}>
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Move buttons + Icon + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Move Buttons */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleMoveLink(index, "up")}
                            disabled={index === 0 || isSearchActive}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title={isSearchActive ? "Pengurutan dinonaktifkan saat pencarian" : "Pindahkan ke atas"}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMoveLink(index, "down")}
                            disabled={index === filteredLinks.length - 1 || isSearchActive}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-black hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title={isSearchActive ? "Pengurutan dinonaktifkan saat pencarian" : "Pindahkan ke bawah"}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        {/* Status indicator pill */}
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${link.is_active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-300"}`} />

                        {/* Icon */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 shadow-inner">
                          <DynamicIcon name={link.icon || "Link"} size={22} />
                        </div>

                        {/* Info details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base text-slate-800 truncate">
                              {link.title}
                            </h3>

                            {/* Badge display */}
                            {link.badge && (
                              <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${getBadgeColor(link.badge)}`}>
                                {link.badge}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {link.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {link.description}
                            </p>
                          )}

                          {/* URL info */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-black transition-colors truncate max-w-[200px]"
                            >
                              {link.url}
                              <ExternalLink size={10} className="shrink-0" />
                            </a>

                            <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                              {link.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Clicks statistics + Status toggle + Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        {/* Click stats */}
                        <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100">
                          <MousePointerClick size={14} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-700">{link.click_count} Click</span>
                        </div>

                        {/* Custom Switch Toggle */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase w-6 text-right">
                            {link.is_active ? "ON" : "OFF"}
                          </span>
                          <button
                            onClick={() => handleToggleActive(link.id, link.is_active)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${link.is_active ? "bg-black" : "bg-slate-200"
                              }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${link.is_active ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            title="Preview Link"
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            onClick={() => handleEditClick(link)}
                            className="p-2 text-slate-400 hover:text-black hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Link"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Link"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Modals */}
        <AddLinkModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchLinks}
        />

        <EditLinkModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedLink(null);
          }}
          onSuccess={fetchLinks}
          link={selectedLink}
        />
    </motion.div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DynamicIcon } from "@/components/admin/dynamic-icon";

// Custom inline SVG icons matching premium style with official colors
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
    style={{ fontSize: size, width: size, height: size, minWidth: size, minHeight: size, color: '#FFFFFF' }} 
  />
);

interface Profile {
  id: string;
  user_id: string;
  username: string;
  fullname: string;
  bio: string | null;
  avatar_url: string | null;
  whatsapp_number: string | null;
  location: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
}

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
}

interface BannerItem {
  id: string;
  title: string;
  description: string | null;
  image: string;
  is_active: boolean;
}

export default function UserBioLinkPage() {
  const params = useParams();
  const username = params.username ? (params.username as string).toLowerCase() : "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          setNotFound(true);
          return;
        }

        setProfile(profileData);

        // Fetch active links ordered by order_no ascending
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .eq("user_id", profileData.user_id)
          .eq("is_active", true)
          .order("order_no", { ascending: true });

        if (linksError) throw linksError;
        setLinks(linksData || []);

        // Fetch active banners (globally)
        const { data: bannersData, error: bannersError } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true);

        if (!bannersError && bannersData) {
          setBanners(bannersData);
        }

      } catch (err) {
        console.error("Gagal memuat halaman bio link:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [username]);

  // Autoplay banner carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  // Handle click stats registration
  const handleLinkClick = async (linkId: string) => {
    try {
      // 1. Optimistic local update
      setLinks((prev) =>
        prev.map((link) =>
          link.id === linkId ? { ...link, click_count: (link.click_count || 0) + 1 } : link
        )
      );

      // 2. Fetch current click_count from database
      const { data, error: fetchError } = await supabase
        .from("links")
        .select("click_count")
        .eq("id", linkId)
        .single();

      if (!fetchError && data) {
        const nextClicks = (data.click_count || 0) + 1;
        // 3. Update database
        await supabase
          .from("links")
          .update({ click_count: nextClicks })
          .eq("id", linkId);
      }
    } catch (err) {
      console.error("Gagal memperbarui data klik:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm text-slate-400 animate-pulse font-medium tracking-wide">Menghubungkan ke halaman...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] px-6 text-center text-white relative overflow-hidden">
        {/* Glowing Background Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="p-5 rounded-3xl bg-red-950/20 border border-red-500/20 mb-6 backdrop-blur-md shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
          Maaf, halaman bio-link "@{(username || "")}" belum terdaftar atau telah dinonaktifkan.
        </p>
        <a 
          href="/" 
          className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 transition-all duration-300"
        >
          Buat LinkHub Anda Sendiri
        </a>
      </div>
    );
  }

  // Animation variants for beautiful staggered entrances
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring" as const, 
        stiffness: 110, 
        damping: 18 
      } 
    },
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const getBadgeStyle = (badgeName: string) => {
    switch (badgeName) {
      case "NEW": return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]";
      case "HOT": return "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse";
      case "PROMO": return "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]";
      case "BEST": return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]";
      default: return "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]";
    }
  };

  // Category customized tags
  const getCategoryTagStyle = (category: string) => {
    switch (category) {
      case "Social Media": return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "Affiliate": return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      case "Marketplace": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "Portfolio": return "bg-pink-500/10 text-pink-300 border-pink-500/20";
      case "Contact": return "bg-teal-500/10 text-teal-300 border-teal-500/20";
      default: return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090d16] text-white px-4 py-20 flex flex-col items-center justify-between font-sans">
      
      {/* Dynamic Animated Background Mesh Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-20 pointer-events-none">
        <motion.div 
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -60, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-[10%] -left-[10%] w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-purple-600/10 blur-[110px]" 
        />
        <motion.div 
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 50, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-[10%] -right-[10%] w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full bg-indigo-500/10 blur-[110px]" 
        />
        <motion.div 
          animate={{
            x: [0, 30, -20, 0],
            y: [0, 30, -40, 0],
            scale: [1, 1.05, 0.9, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[35%] left-[15%] w-[250px] h-[250px] rounded-full bg-teal-500/5 blur-[90px]" 
        />
      </div>

      {/* Main Glassmorphic Card Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-[430px] mt-16 px-6 pt-24 pb-8 rounded-[36px] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center"
      >
        {/* Overlapping Avatar Container */}
        <motion.div 
          variants={itemVariants}
          className="absolute -top-16 left-1/2 -translate-x-1/2 p-2 rounded-full border border-white/[0.08] bg-[#090d16]/90 backdrop-blur-md shadow-[0_0_35px_rgba(168,85,247,0.25)]"
        >
          {/* Animated Glow Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-pulse pointer-events-none" />
          <div className="absolute inset-1 rounded-full border border-purple-400/30 pointer-events-none" />
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white/20 bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={profile.avatar_url} 
                alt={profile.fullname} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <span className="text-3xl font-extrabold bg-gradient-to-tr from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                {profile.fullname?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>

        {/* Fullname */}
        <motion.h1 
          variants={itemVariants}
          className="text-2xl font-bold tracking-tight text-white/95 mb-1 mt-2"
        >
          {profile.fullname}
        </motion.h1>

        {/* Username Handle */}
        <motion.p 
          variants={itemVariants}
          className="text-sm font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-4"
        >
          @{profile.username}
        </motion.p>

        {/* Bio */}
        {profile.bio && (
          <motion.p 
            variants={itemVariants}
            className="text-sm text-slate-300/90 font-light leading-relaxed max-w-[320px] mb-4 whitespace-pre-wrap px-2"
          >
            {profile.bio}
          </motion.p>
        )}

        {/* Location */}
        {profile.location && (
          <motion.p 
            variants={itemVariants}
            className="text-xs text-slate-400 flex items-center gap-1.5 mb-6"
          >
            <MapPin size={12} className="text-purple-400 shrink-0" />
            {profile.location}
          </motion.p>
        )}

        {/* Social Icons Bar (Circular Glassmorphic Buttons) */}
        {(profile.whatsapp_number || profile.instagram_url || profile.tiktok_url || profile.facebook_url) && (
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-center gap-4 mb-8"
          >
            {profile.whatsapp_number && (
              <a 
                href={`https://wa.me/${profile.whatsapp_number}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center h-11 w-11 rounded-full bg-white/[0.03] border border-white/[0.08] text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/40 hover:scale-110 active:scale-95 shadow-md transition-all duration-300"
                aria-label="WhatsApp"
              >
                <WhatsApp size={20} />
              </a>
            )}
            {profile.instagram_url && (
              <a 
                href={`https://instagram.com/${profile.instagram_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center h-11 w-11 rounded-full bg-white/[0.03] border border-white/[0.08] text-[#E1306C] hover:bg-[#E1306C]/10 hover:border-[#E1306C]/40 hover:scale-110 active:scale-95 shadow-md transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            )}
            {profile.tiktok_url && (
              <a 
                href={`https://tiktok.com/@${profile.tiktok_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center h-11 w-11 rounded-full bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/10 hover:border-white/30 hover:scale-110 active:scale-95 shadow-md transition-all duration-300"
                aria-label="TikTok"
              >
                <TikTok size={20} />
              </a>
            )}
            {profile.facebook_url && (
              <a 
                href={profile.facebook_url.startsWith("http") ? profile.facebook_url : `https://${profile.facebook_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center h-11 w-11 rounded-full bg-white/[0.03] border border-white/[0.08] text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/40 hover:scale-110 active:scale-95 shadow-md transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            )}
          </motion.div>
        )}

        {/* Premium Banner Carousel Slider */}
        {banners.length > 0 && (
          <motion.div 
            variants={itemVariants}
            className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-6 border border-white/[0.08] group shadow-[0_10px_30px_rgba(0,0,0,0.3)] bg-black/40"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={banners[currentBannerIndex].id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 w-full h-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={banners[currentBannerIndex].image} 
                  alt={banners[currentBannerIndex].title} 
                  className="w-full h-full object-cover"
                />
                
                {/* Text overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 flex flex-col justify-end p-3 text-left">
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {banners[currentBannerIndex].title}
                  </h4>
                  {banners[currentBannerIndex].description && (
                    <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5 font-light">
                      {banners[currentBannerIndex].description}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            {banners.length > 1 && (
              <>
                <button 
                  onClick={prevBanner}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={nextBanner}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
                  {banners.map((_, i) => (
                    <span 
                      key={i} 
                      className={`h-1.2 rounded-full transition-all duration-300 ${
                        i === currentBannerIndex ? "w-3.5 bg-white" : "w-1.2 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Links List with Glow-on-Hover Glassmorphic Cards */}
        <div className="w-full space-y-4 mb-4">
          {links.length > 0 ? (
            links.map((link) => (
              <motion.a
                key={link.id}
                variants={itemVariants}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link.id)}
                className="relative flex items-center gap-4 w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.07] hover:scale-[1.02] active:scale-[0.98] hover:border-purple-500/40 shadow-[0_4px_30px_rgba(0,0,0,0.15)] transition-all duration-300 group text-left cursor-pointer overflow-hidden"
              >
                {/* Neon bottom glow line */}
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/0 to-transparent group-hover:via-purple-500/50 transition-all duration-500" />

                {/* Icon wrapper with hover glow */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white shadow-inner group-hover:bg-purple-600/20 group-hover:text-purple-300 transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                  <DynamicIcon name={link.icon || "Link"} size={20} />
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-wide text-white/90 group-hover:text-purple-300 transition-colors truncate">
                      {link.title}
                    </span>
                  </div>

                  {link.description && (
                    <p className="text-xs text-slate-400 font-light mt-0.5 line-clamp-1 group-hover:text-slate-300 transition-colors">
                      {link.description}
                    </p>
                  )}

                  {/* Category Pill tag */}
                  {link.category && (
                    <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${getCategoryTagStyle(link.category)}`}>
                      {link.category}
                    </span>
                  )}
                </div>

                {/* Badge Overlay */}
                {link.badge && (
                  <span className={`absolute top-3 right-3 inline-flex px-1.8 py-0.5 text-[8px] font-black uppercase rounded-md tracking-wider ${getBadgeStyle(link.badge)}`}>
                    {link.badge}
                  </span>
                )}
                
                {/* Floating Chevron / Indicator */}
                <div className="absolute right-4 bottom-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-purple-300" />
                </div>
              </motion.a>
            ))
          ) : (
            <motion.p 
              variants={itemVariants}
              className="text-sm text-slate-500 italic py-8"
            >
              Belum ada link yang aktif.
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Premium Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:border-white/10 text-[9px] tracking-widest uppercase font-bold text-slate-400 hover:text-white transition-all backdrop-blur-sm shadow-sm"
        >
          Powered by <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent font-extrabold">LinkHub</span>
        </a>
      </motion.div>
    </div>
  );
}

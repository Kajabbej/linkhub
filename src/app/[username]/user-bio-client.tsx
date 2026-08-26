"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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
  cover_url: string | null;
  whatsapp_number: string | null;
  location: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  views_count: number;
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
}

interface BannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  image_alt: string;
  background_type: "image" | "gradient" | "solid";
  background_color: string;
  gradient_from: string | null;
  gradient_to: string | null;
  image_position: "left" | "center" | "right";
  overlay_opacity: number;
  button_text: string | null;
  button_url: string | null;
  open_in_new_tab: boolean;
  order_no: number;
}

interface BannerSettings {
  autoplay: boolean;
  interval: number;
  transition: "fade" | "slide" | "zoom";
  show_navigation: boolean;
  show_indicator: boolean;
}

export function UserBioClient({
  profile,
  links: initialLinks,
  banners,
  bannerSettings,
}: {
  profile: Profile;
  links: LinkItem[];
  banners: BannerItem[];
  bannerSettings: BannerSettings;
}) {
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [clickedBanners, setClickedBanners] = useState<Record<string, number>>({});


  // 1. Client-side analytical logging with server-side validation & LocalStorage throttling
  useEffect(() => {
    if (!profile) return;

    try {
      const todayStr = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const historyKey = "linkhub_views_history";
      
      let historyObj: Record<string, string> = {};
      const localHistory = localStorage.getItem(historyKey);
      if (localHistory) {
        try {
          historyObj = JSON.parse(localHistory);
        } catch {
          historyObj = {};
        }
      }

      // Check if this profile was already viewed today from this browser (LocalStorage optimization)
      if (historyObj[profile.id] === todayStr) {
        return; 
      }

      // Send log request to API route for secure server-side verification and database logging
      fetch(`/api/views/${profile.id}`, { method: "POST" })
        .then(async (res) => {
          if (res.ok) {
            // Save daily view log token locally only after successful server-side record
            historyObj[profile.id] = todayStr;
            localStorage.setItem(historyKey, JSON.stringify(historyObj));
          } else {
            console.error("Server menolak pencatatan kunjungan:", await res.text());
          }
        })
        .catch((err) => {
          console.error("Gagal mengirim data kunjungan ke server:", err);
        });
    } catch (err) {
      console.error("Kesalahan log kunjungan:", err);
    }
  }, [profile]);

  // Autoplay banner carousel with custom settings
  useEffect(() => {
    if (banners.length <= 1 || !bannerSettings.autoplay) return;
    const intervalTime = (bannerSettings.interval || 5) * 1000;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [banners, bannerSettings]);

  // Handle banner click tracking (rate limited to 3 seconds per banner)
  const handleBannerClick = async (bannerId: string) => {
    const now = Date.now();
    const lastClicked = clickedBanners[bannerId] || 0;
    if (now - lastClicked < 3000) return; // 3 seconds cooldown

    setClickedBanners((prev) => ({ ...prev, [bannerId]: now }));

    try {
      await fetch(`/api/banners/${bannerId}/click`, { method: "POST" });
    } catch (err) {
      console.error("Gagal mengirim data klik banner ke server:", err);
    }
  };


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

  // Helper functions to normalize social media links
  const getWhatsAppUrl = (input: string) => {
    if (!input) return "";
    if (input.includes("wa.me") || input.includes("whatsapp.com")) {
      return input.startsWith("http") ? input : `https://${input}`;
    }
    let clean = input.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    } else if (clean.length > 0 && !clean.startsWith("62")) {
      clean = "62" + clean;
    }
    return `https://wa.me/${clean}`;
  };

  const getInstagramUrl = (input: string) => {
    if (!input) return "";
    if (input.includes("instagram.com")) {
      return input.startsWith("http") ? input : `https://${input}`;
    }
    const username = input.replace(/^@/, "");
    return `https://instagram.com/${username}`;
  };

  const getTikTokUrl = (input: string) => {
    if (!input) return "";
    if (input.includes("tiktok.com")) {
      return input.startsWith("http") ? input : `https://${input}`;
    }
    const username = input.replace(/^@/, "");
    return `https://tiktok.com/@${username}`;
  };

  const getFacebookUrl = (input: string) => {
    if (!input) return "";
    if (input.includes("facebook.com")) {
      return input.startsWith("http") ? input : `https://${input}`;
    }
    return `https://facebook.com/${input}`;
  };

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#090d16] text-white flex flex-col items-center justify-between font-sans">
      
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

      {/* Cover Photo — full width, sits above the card */}
      {profile.cover_url && (
        <div className="relative w-full max-w-[430px] h-[160px] md:h-[200px] overflow-hidden rounded-b-[32px] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.cover_url}
            alt={`Foto sampul ${profile.username}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Bottom fade for smooth card overlap */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#090d16] to-transparent" />
        </div>
      )}

      {/* Main Glassmorphic Card Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`relative w-full max-w-[430px] px-6 pt-24 pb-8 rounded-[36px] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center ${
          profile.cover_url ? "-mt-12" : "mt-16"
        }`}
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
              <Image 
                src={profile.avatar_url} 
                alt={profile.fullname} 
                width={112}
                height={112}
                unoptimized
                priority
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
                href={getWhatsAppUrl(profile.whatsapp_number)} 
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
                href={getInstagramUrl(profile.instagram_url)} 
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
                href={getTikTokUrl(profile.tiktok_url)} 
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
                href={getFacebookUrl(profile.facebook_url)} 
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
            className="relative w-full aspect-[21/9] md:aspect-[21/8] rounded-2xl overflow-hidden mb-6 border border-white/[0.08] group shadow-[0_10px_30px_rgba(0,0,0,0.35)] bg-slate-900"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={banners[currentBannerIndex].id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                style={
                  banners[currentBannerIndex].background_type !== "image"
                    ? banners[currentBannerIndex].background_type === "gradient"
                      ? { backgroundImage: `linear-gradient(135deg, ${banners[currentBannerIndex].gradient_from || '#4F46E5'}, ${banners[currentBannerIndex].gradient_to || '#EC4899'})` }
                      : { backgroundColor: banners[currentBannerIndex].background_color || '#0F172A' }
                    : {}
                }
                className="absolute inset-0 w-full h-full flex flex-col md:flex-row overflow-hidden cursor-pointer select-none"
                onClick={() => handleBannerClick(banners[currentBannerIndex].id)}
              >
                {/* Full Image Background for 'image' type */}
                {banners[currentBannerIndex].background_type === "image" && banners[currentBannerIndex].image_url && (
                  <Image 
                    src={banners[currentBannerIndex].image_url} 
                    alt={banners[currentBannerIndex].image_alt} 
                    fill
                    sizes="(max-w-768px) 100vw, 430px"
                    priority
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Semi-transparan Overlay */}
                <div 
                  style={{ backgroundColor: `rgba(0, 0, 0, ${(banners[currentBannerIndex].overlay_opacity || 0) / 100})` }}
                  className="absolute inset-0 z-[1] transition-all"
                />

                {/* Desktop Split / Mobile Stack Cover Image for solid/gradient background */}
                {banners[currentBannerIndex].background_type !== "image" && banners[currentBannerIndex].image_url && (
                  <div 
                    className={`relative z-[2] shrink-0 w-full md:w-[45%] h-[40%] md:h-full ${
                      banners[currentBannerIndex].image_position === "left" 
                        ? "order-first" 
                        : banners[currentBannerIndex].image_position === "right" 
                        ? "order-last" 
                        : "hidden" // If center, don't show split
                    }`}
                  >
                    <Image 
                      src={banners[currentBannerIndex].image_url} 
                      alt={banners[currentBannerIndex].image_alt} 
                      fill
                      sizes="(max-w-768px) 100vw, 200px"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Text Content Area */}
                <div 
                  className={`relative z-[2] flex-1 flex flex-col justify-center p-4 md:p-6 text-white ${
                    banners[currentBannerIndex].background_type !== "image" && banners[currentBannerIndex].image_url && banners[currentBannerIndex].image_position !== "center"
                      ? "h-[60%] md:h-full text-left items-start"
                      : banners[currentBannerIndex].image_position === "left"
                      ? "text-left items-start"
                      : banners[currentBannerIndex].image_position === "right"
                      ? "text-right items-end"
                      : "text-center items-center"
                  }`}
                >
                  {banners[currentBannerIndex].subtitle && (
                    <span className="text-[9px] md:text-[10px] font-extrabold tracking-widest text-pink-400 uppercase drop-shadow-sm select-none">
                      {banners[currentBannerIndex].subtitle}
                    </span>
                  )}
                  
                  <h4 className="text-sm md:text-base font-black mt-1 leading-tight drop-shadow-md select-none">
                    {banners[currentBannerIndex].title}
                  </h4>

                  {banners[currentBannerIndex].description && (
                    <p className="text-[10px] md:text-xs text-white/95 line-clamp-2 md:line-clamp-3 mt-1.5 font-normal leading-relaxed max-w-md drop-shadow-sm select-none">
                      {banners[currentBannerIndex].description}
                    </p>
                  )}

                  {/* CTA Button */}
                  {banners[currentBannerIndex].button_text && banners[currentBannerIndex].button_url && (
                    <a
                      href={banners[currentBannerIndex].button_url.startsWith("http") ? banners[currentBannerIndex].button_url : `https://${banners[currentBannerIndex].button_url}`}
                      target={banners[currentBannerIndex].open_in_new_tab ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        // Prevent bubbling to outer container click tracking
                        e.stopPropagation();
                        handleBannerClick(banners[currentBannerIndex].id);
                      }}
                      className="mt-3 md:mt-4 inline-flex items-center justify-center bg-white text-black font-extrabold text-[10px] md:text-xs px-4 md:px-5 py-2 rounded-full shadow hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                      {banners[currentBannerIndex].button_text}
                    </a>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            {banners.length > 1 && bannerSettings.show_navigation && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevBanner(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-black/45 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/75 cursor-pointer shadow-md"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextBanner(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-black/45 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/75 cursor-pointer shadow-md"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Indicator Dots */}
            {banners.length > 1 && bannerSettings.show_indicator && (
              <div className="absolute bottom-2.5 right-3.5 z-10 flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-full backdrop-blur-xs border border-white/5">
                {banners.map((_, i) => (
                  <button 
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentBannerIndex(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentBannerIndex ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
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

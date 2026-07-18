import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserBioClient } from "./user-bio-client";

// Enable Incremental Static Regeneration (ISR) to cache rarely changed profiles & banners at the Edge for 60 seconds
export const revalidate = 60;

interface PageProps {
  params: Promise<{ username: string }>;
}

// Generate Dynamic SEO and Open Graph metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const lowerUsername = username ? username.toLowerCase() : "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("fullname, bio, avatar_url")
    .eq("username", lowerUsername)
    .maybeSingle();

  if (!profile) {
    return {
      title: "Halaman Tidak Ditemukan - LinkHub",
      description: "Halaman bio-link yang Anda cari tidak ditemukan.",
    };
  }

  const bioDescription = profile.bio || `Bio link resmi dari ${profile.fullname}. Temukan info kontak, portofolio, dan media sosial terbaru.`;

  return {
    title: `${profile.fullname} (@${lowerUsername}) - LinkHub`,
    description: bioDescription,
    openGraph: {
      title: `${profile.fullname} (@${lowerUsername}) | LinkHub`,
      description: bioDescription,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.fullname} (@${lowerUsername}) - LinkHub`,
      description: bioDescription,
    }
  };
}

export default async function UserBioLinkPage({ params }: PageProps) {
  const { username } = await params;
  const lowerUsername = username ? username.toLowerCase() : "";

  // 1. Fetch Profile on the server with optimized columns selection
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, username, fullname, bio, avatar_url, whatsapp_number, location, instagram_url, tiktok_url, facebook_url, views_count")
    .eq("username", lowerUsername)
    .maybeSingle();

  if (profileError || !profile) {
    notFound();
  }

  // 2. Fetch Active Links on the server with optimized columns selection
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("id, title, description, url, icon, badge, category, click_count, is_active, order_no")
    .eq("user_id", profile.user_id)
    .eq("is_active", true)
    .order("order_no", { ascending: true });

  if (linksError) {
    console.error("Gagal memuat link dari server:", linksError);
  }

  // 3. Fetch Active Banners on the server with optimized columns selection and user_id filtering
  const { data: banners, error: bannersError } = await supabase
    .from("banners")
    .select("id, title, subtitle, description, image_url, image_alt, background_type, background_color, gradient_from, gradient_to, image_position, overlay_opacity, button_text, button_url, open_in_new_tab, order_no")
    .eq("user_id", profile.user_id)
    .eq("is_active", true)
    .order("order_no", { ascending: true });

  if (bannersError) {
    console.error("Gagal memuat banner dari server:", bannersError);
  }

  // 4. Fetch Global Banner Settings on the server
  const { data: bannerSettings, error: settingsError } = await supabase
    .from("banner_settings")
    .select("autoplay, interval, transition, show_navigation, show_indicator")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  if (settingsError) {
    console.error("Gagal memuat pengaturan banner dari server:", settingsError);
  }

  const defaultSettings = {
    autoplay: true,
    interval: 5,
    transition: "fade" as const,
    show_navigation: true,
    show_indicator: true
  };

  return (
    <UserBioClient
      profile={profile}
      links={links || []}
      banners={banners || []}
      bannerSettings={bannerSettings || defaultSettings}
    />
  );
}

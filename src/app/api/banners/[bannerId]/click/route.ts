import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Simple in-memory rate limiter cache
const ipCooldowns = new Map<string, number>();
const COOLDOWN_MS = 3000; // 3 seconds cooldown

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bannerId: string }> }
) {
  try {
    const { bannerId } = await params;
    if (!bannerId) {
      return NextResponse.json({ error: "ID banner tidak valid" }, { status: 400 });
    }

    // Simple IP-based rate limiter
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown-ip";
    const now = Date.now();
    const lastClickTime = ipCooldowns.get(ip) || 0;
    if (now - lastClickTime < COOLDOWN_MS) {
      return NextResponse.json({ error: "Terlalu banyak permintaan (rate limit)" }, { status: 429 });
    }
    ipCooldowns.set(ip, now);

    // 1. Fetch current click_count and check is_active
    const { data: banner, error: fetchError } = await supabase
      .from("banners")
      .select("id, click_count, is_active")
      .eq("id", bannerId)
      .maybeSingle();

    if (fetchError || !banner) {
      return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    if (!banner.is_active) {
      return NextResponse.json({ error: "Banner tidak aktif" }, { status: 400 });
    }

    // 2. Increment click_count and update last_clicked_at
    const { error: updateError } = await supabase
      .from("banners")
      .update({ 
        click_count: (banner.click_count || 0) + 1,
        last_clicked_at: new Date().toISOString()
      })
      .eq("id", bannerId);

    if (updateError) {
      console.error("Gagal mencatat statistik klik banner:", updateError);
      return NextResponse.json({ error: "Gagal mencatat statistik klik" }, { status: 500 });
    }

    return NextResponse.json({ success: true, clickCount: (banner.click_count || 0) + 1 });
  } catch (err) {
    console.error("Server-side banner click tracking error:", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

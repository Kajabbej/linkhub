import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    
    if (!profileId) {
      return NextResponse.json({ error: "ID profil tidak valid" }, { status: 400 });
    }

    // 1. Validasi keberadaan profil di sisi server sebelum mencatat kunjungan
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, views_count")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }

    // 2. Catat log kunjungan ke tabel profile_views
    const { error: insertError } = await supabase
      .from("profile_views")
      .insert({ profile_id: profileId });

    if (insertError) {
      console.error("Gagal menyimpan log kunjungan di server:", insertError);
      return NextResponse.json({ error: "Gagal mencatat log kunjungan" }, { status: 500 });
    }

    // 3. Perbarui total views_count di profil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ views_count: (profile.views_count || 0) + 1 })
      .eq("id", profileId);

    if (updateError) {
      console.error("Gagal memperbarui total views di server:", updateError);
      return NextResponse.json({ error: "Gagal memperbarui total views" }, { status: 500 });
    }

    return NextResponse.json({ success: true, nextViews: (profile.views_count || 0) + 1 });
  } catch (err) {
    console.error("Server-side view tracking error:", err);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

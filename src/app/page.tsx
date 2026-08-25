"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Shield, BarChart3, LayoutTemplate, Star, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 text-white overflow-hidden selection:bg-pink-500/30">
      {/* Background radial/mesh decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.12),transparent_45%)]"></div>
      
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="LinkHub Logo"
            width={40}
            height={40}
            className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            LinkHub
          </span>
        </div>
        <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 px-5 py-2.5 text-sm font-semibold text-white border border-white/10 transition-all backdrop-blur-md">
          Masuk Admin
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 py-12 z-10">
        {/* Left column: Text */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400"
          >
            <Star size={12} className="fill-indigo-400" />
            <span>LinkHub V1.0 - Premium Bio Link Manager</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight"
          >
            Satu Tautan untuk <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              Identitas Digital
            </span> Anda.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed max-w-lg"
          >
            Kelola seluruh tautan promosi, portfolio, media sosial, dan affiliate Anda melalui satu dashboard interaktif yang modern, responsif, dan terproteksi aman.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link href="/login" className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98]">
              Kelola Link Sekarang
              <ArrowRight size={18} />
            </Link>
            <a
              href="#fitur"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold border border-slate-800 transition-all"
            >
              Pelajari Fitur
            </a>
          </motion.div>
        </div>

        {/* Right column: Interactive mockup preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex-1 w-full max-w-md relative"
        >
          {/* Decorative glowing background */}
          <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-indigo-500 to-pink-500 opacity-20 blur-xl"></div>
          
          {/* Glass Mockup Card */}
          <div className="relative rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-2xl">
            {/* Phone style top bar */}
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div className="w-12 h-1 bg-white/20 rounded-full"></div>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
              </div>
            </div>

            {/* Profile area */}
            <div className="flex flex-col items-center text-center gap-3 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 p-0.5 shadow-lg drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center p-2.5 overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Mockup Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg">Budistore</h3>
                <p className="text-xs text-slate-400">@budistore • Official Bio Link</p>
              </div>
            </div>

            {/* Link Items Mockup */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <Star size={16} />
                  </div>
                  <span className="font-semibold text-sm">Produk Rekomendasi</span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </div>

              <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <ExternalLink size={16} />
                  </div>
                  <span className="font-semibold text-sm">WhatsApp Admin</span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="fitur" className="w-full border-t border-slate-800 bg-slate-950/40 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Fitur Premium LinkHub</h2>
            <p className="text-slate-400 text-sm">Segala yang Anda butuhkan untuk memperluas jangkauan online Anda secara instan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <LayoutTemplate size={24} />
              </div>
              <h3 className="text-lg font-bold">Template Glassmorphism</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Tampilan halaman publik premium dengan efek blur kaca modern yang menakjubkan dan responsif di semua perangkat.</p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-lg font-bold">Statistik Kunjungan</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Pantau jumlah pembaca profil dan analitik klik setiap tautan Anda secara real-time langsung melalui dashboard.</p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700/80 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold">Autentikasi Supabase</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Manajemen login dan keamanan database tingkat tinggi menggunakan enkripsi data dan proteksi role middleware.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950 py-8 z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="LinkHub Logo"
              width={16}
              height={16}
              className="w-4 h-4 object-contain opacity-60"
            />
            <span>&copy; {new Date().getFullYear()} LinkHub. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Admin Login</Link>
            <span className="text-slate-800">|</span>
            <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Powered by Next.js</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

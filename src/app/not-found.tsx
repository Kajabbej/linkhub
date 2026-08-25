"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 text-white overflow-hidden selection:bg-pink-500/30">
      {/* Background radial/mesh decoration */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_45%)]"></div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-start z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="LinkHub Logo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain opacity-80"
          />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
            LinkHub
          </span>
        </div>
      </header>

      {/* 404 Error Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-6 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500"
        >
          <AlertCircle size={32} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-7xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent"
        >
          404
        </motion.h1>

        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-2xl font-bold text-slate-100"
          >
            Halaman Tidak Ditemukan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-slate-400 text-sm max-w-md mx-auto"
          >
            Maaf, halaman yang Anda cari tidak tersedia, memiliki akses terbatas, atau telah dipindahkan ke alamat lain.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-4"
        >
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold border border-slate-800 transition-all">
            <ArrowLeft size={16} />
            Kembali Ke Beranda
          </Link>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-slate-600 z-10">
        &copy; {new Date().getFullYear()} LinkHub. All rights reserved.
      </footer>
    </div>
  );
}

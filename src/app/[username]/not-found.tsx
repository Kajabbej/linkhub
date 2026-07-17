import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] px-6 text-center text-white relative overflow-hidden font-sans">
      {/* Glowing Background Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="p-5 rounded-3xl bg-red-950/20 border border-red-500/20 mb-6 backdrop-blur-md shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
        Maaf, halaman bio-link yang Anda tuju belum terdaftar atau telah dinonaktifkan oleh pemiliknya.
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

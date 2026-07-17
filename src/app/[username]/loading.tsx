export default function Loading() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#090d16] text-white px-4 py-20 flex flex-col items-center justify-between font-sans">
      
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden -z-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-purple-600/10 blur-[110px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full bg-indigo-500/10 blur-[110px]" />
      </div>

      {/* Loading Glassmorphic Card Mockup */}
      <div className="relative w-full max-w-[430px] mt-16 px-6 pt-24 pb-8 rounded-[36px] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex flex-col items-center justify-start text-center animate-pulse">
        
        {/* Skeleton Avatar */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 p-2 rounded-full border border-white/[0.08] bg-[#090d16]/90 backdrop-blur-md">
          <div className="h-28 w-28 rounded-full bg-slate-800" />
        </div>

        {/* Skeleton Title (Name) */}
        <div className="h-7 w-48 bg-slate-800 rounded-md mb-2 mt-2" />

        {/* Skeleton Subtitle (Username) */}
        <div className="h-4 w-24 bg-slate-800 rounded-md mb-4" />

        {/* Skeleton Bio */}
        <div className="space-y-2 mb-4 w-full px-4 flex flex-col items-center">
          <div className="h-3.5 bg-slate-800 rounded w-5/6" />
          <div className="h-3.5 bg-slate-800 rounded w-2/3" />
        </div>

        {/* Skeleton Location */}
        <div className="h-3 w-32 bg-slate-800 rounded-md mb-6" />

        {/* Skeleton Social Buttons */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-11 w-11 rounded-full bg-slate-800" />
          <div className="h-11 w-11 rounded-full bg-slate-800" />
          <div className="h-11 w-11 rounded-full bg-slate-800" />
        </div>

        {/* Skeleton Banner Carousel */}
        <div className="w-full aspect-[21/9] rounded-2xl bg-slate-800/80 mb-6" />

        {/* Skeleton Links List */}
        <div className="w-full space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="h-11 w-11 shrink-0 bg-slate-800 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Skeleton Footer */}
      <div className="mt-12 h-8 w-36 bg-slate-800/50 rounded-full" />

    </div>
  );
}

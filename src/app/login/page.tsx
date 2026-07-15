"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setSession } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

// Form validation schema
const loginSchema = zod.object({
  email: zod.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: zod.string().min(8, "Password minimal 8 karakter"),
});

type LoginFormValues = zod.infer<typeof loginSchema>;

// Helper to detect browser & device
const getBrowserAndDevice = () => {
  if (typeof window === "undefined") return { browser: "Server", device: "Server" };
  const ua = navigator.userAgent;
  let browser = "Browser Lain";
  let device = "Desktop";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";

  if (/Android/i.test(ua)) device = "Android";
  else if (/iPhone|iPad/i.test(ua)) device = "iOS";
  
  return { browser, device };
};

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Get IP Address
    let ipAddress = "127.0.0.1";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const ipData = await res.json();
      ipAddress = ipData.ip;
    } catch (e) {
      console.warn("Gagal fetch IP address public, menggunakan fallback.");
    }

    const { browser, device } = getBrowserAndDevice();

    try {
      // Query users table for matching email & password (plaintext)
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("email", values.email)
        .eq("password", values.password)
        .single();

      if (error || !data) {
        setErrorMessage("Email atau password salah.");
        
        // Record failed attempt in login_logs
        await supabase.from("login_logs").insert({
          email: values.email,
          ip_address: ipAddress,
          browser,
          device,
          status: "FAILED"
        });
        
        setIsLoading(false);
        return;
      }

      if (data.role !== "admin") {
        setErrorMessage("Akses ditolak. Anda bukan Admin.");
        
        // Record failed attempt in login_logs
        await supabase.from("login_logs").insert({
          user_id: data.id,
          email: values.email,
          ip_address: ipAddress,
          browser,
          device,
          status: "FAILED"
        });
        
        setIsLoading(false);
        return;
      }

      // Record successful login log
      await supabase.from("login_logs").insert({
        user_id: data.id,
        email: values.email,
        ip_address: ipAddress,
        browser,
        device,
        status: "SUCCESS"
      });

      // Save session in cookie & localStorage
      setSession(data.id, data.email, data.name);
      
      // Redirect to admin dashboard
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 selection:bg-black/10">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px]"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-md">
            <LinkIcon size={24} strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Masuk ke LinkHub</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola bio link & affiliate marketing Anda</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-black/5 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Global Error Alert */}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@linkhub.com"
                disabled={isLoading}
                className="rounded-xl border-slate-200 bg-white px-3.5 py-5 text-sm shadow-xs transition-all focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="rounded-xl border-slate-200 bg-white pl-3.5 pr-10 py-5 text-sm shadow-xs transition-all focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-black py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-black/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk Ke Dashboard"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

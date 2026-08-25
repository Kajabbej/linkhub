"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { motion, useReducedMotion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setSession } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { LoginButton } from "./login-button";

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

export function LoginForm() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shake animation trigger state
  const [shake, setShake] = useState(false);

  // Field refs for manual focus on error
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // Setup form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setFocus,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Track OAuth sessions (e.g. Google Login redirect)
  useEffect(() => {
    const checkOAuthSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setIsLoading(true);
        try {
          let { data, error } = await supabase
            .from("users")
            .select("id, name, email, role")
            .eq("email", session.user.email)
            .maybeSingle();

          if (!data) {
            const fullName = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
            const { data: newUser, error: insertError } = await supabase
              .from("users")
              .insert({
                name: fullName,
                email: session.user.email,
                password: "oauth_google_generated",
                role: "admin"
              })
              .select("id, name, email, role")
              .single();

            if (insertError || !newUser) {
              throw new Error("Gagal mendaftarkan user baru.");
            }
            data = newUser;
          }

          // Record login log
          let ipAddress = "127.0.0.1";
          try {
            const res = await fetch("https://api.ipify.org?format=json");
            const ipData = await res.json();
            ipAddress = ipData.ip;
          } catch (e) {
            console.warn("Gagal fetch IP address public, menggunakan fallback.");
          }
          const { browser, device } = getBrowserAndDevice();

          await supabase.from("login_logs").insert({
            email: session.user.email,
            ip_address: ipAddress,
            browser,
            device,
            status: "SUCCESS"
          });

          // Set animation flag before redirect
          sessionStorage.setItem("just_logged_in", "true");

          setSession(data.id, data.email, data.name);
          router.push("/admin");
          router.refresh();
        } catch (err) {
          triggerShake();
          setErrorMessage("Terjadi kesalahan saat memverifikasi akun Google.");
          setIsLoading(false);
        }
      }
    };
    checkOAuthSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        checkOAuthSession();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const triggerShake = () => {
    if (shouldReduceMotion) return;
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/masuk-admin-rahasia`
        }
      });
      if (error) throw error;
    } catch (err) {
      triggerShake();
      setErrorMessage("Gagal menghubungkan ke Google.");
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

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
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("email", values.email)
        .eq("password", values.password)
        .single();

      if (error || !data) {
        triggerShake();
        setErrorMessage("Email atau password salah.");

        await supabase.from("login_logs").insert({
          email: values.email,
          ip_address: ipAddress,
          browser,
          device,
          status: "FAILED"
        });

        setIsLoading(false);

        // Auto focus password field if email seems fine, or email otherwise
        setTimeout(() => {
          setFocus("password");
        }, 50);
        return;
      }

      if (data.role !== "admin") {
        triggerShake();
        setErrorMessage("Akses ditolak. Anda bukan Admin.");

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

      await supabase.from("login_logs").insert({
        user_id: data.id,
        email: values.email,
        ip_address: ipAddress,
        browser,
        device,
        status: "SUCCESS"
      });

      // Set animation flag before redirect
      sessionStorage.setItem("just_logged_in", "true");

      setSession(data.id, data.email, data.name);

      router.push("/admin");
      router.refresh();
    } catch (err) {
      triggerShake();
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  // Shake animation variants
  const shakeVariants: Variants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.35, ease: "easeInOut" }
    },
    idle: { x: 0 }
  };

  // Custom registered ref callbacks for autofocus on validation failure
  const { ref: emailRegRef, ...emailRegRest } = register("email");
  const { ref: passwordRegRef, ...passwordRegRest } = register("password");

  // Hook form validation failures autofocus
  useEffect(() => {
    if (errors.email) {
      setFocus("email");
    } else if (errors.password) {
      setFocus("password");
    }
  }, [errors, setFocus]);

  return (
    <motion.div
      animate={shake ? "shake" : "idle"}
      variants={shakeVariants}
      className="rounded-2xl border border-black/5 bg-white/80 p-8 shadow-xl backdrop-blur-xl transform-gpu"
    >
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
            className={`rounded-xl bg-white px-3.5 py-5 text-sm shadow-xs transition-all focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10 ${errors.email ? "border-red-500 focus-visible:ring-red-500/20" : "border-slate-200"
              }`}
            {...emailRegRest}
            ref={(e) => {
              emailRegRef(e);
              emailRef.current = e;
            }}
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
              className={`rounded-xl bg-white pl-3.5 pr-10 py-5 text-sm shadow-xs transition-all focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10 ${errors.password ? "border-red-500 focus-visible:ring-red-500/20" : "border-slate-200"
                }`}
              {...passwordRegRest}
              ref={(e) => {
                passwordRegRef(e);
                passwordRef.current = e;
              }}
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
        <LoginButton isLoading={isLoading}>
          Masuk Ke Dashboard
        </LoginButton>
      </form>

      {/* Google Login Button */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white/80 px-2 text-slate-500 backdrop-blur-xl">Atau masuk dengan</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-white border border-slate-200 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </button>
    </motion.div>
  );
}

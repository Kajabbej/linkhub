"use client";

import { Logo } from "@/components/shared/logo";
import { LoginForm } from "@/components/auth/login-form";
import { PageTransition } from "@/components/shared/page-transition";

export default function LoginPage() {
  return (
    <PageTransition className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 selection:bg-black/10 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} showText={true} />
          <p className="text-sm text-slate-500 font-medium mt-1">Build Your Digital Identity</p>
        </div>

        {/* Card Form */}
        <LoginForm />
      </div>
    </PageTransition>
  );
}

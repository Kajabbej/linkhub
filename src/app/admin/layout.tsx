"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { BrandTransition } from "@/components/auth/brand-transition";
import { Toaster, toast } from "sonner";
import { getAdminUser } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showTransition, setShowTransition] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Retrieve logged in user profile details
    const user = getAdminUser();
    setAdminUser(user);

    // Verify if we just signed in and should play transition
    const isJustLoggedIn = sessionStorage.getItem("just_logged_in") === "true";
    if (isJustLoggedIn) {
      setShowTransition(true);
    }
  }, []);

  const handleTransitionComplete = () => {
    setShowTransition(false);
    
    // Display welcome toast
    const name = adminUser?.name || "Admin";
    toast.success(`Welcome back, ${name}! 👋`, {
      description: "Successfully signed in.",
      duration: 2500,
    });
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-slate-900 selection:bg-black/10">
      {/* Toast notifications */}
      <Toaster richColors position="top-right" closeButton />

      {/* One-time Brand Transition Overlay */}
      {showTransition && (
        <BrandTransition onComplete={handleTransitionComplete} />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (Mobile Header + Desktop Actions) */}
        <header className="flex h-16 items-center justify-between border-b bg-white/50 px-4 md:px-8 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <MobileSidebar />
            <div id="mobile-logo" className="md:hidden font-bold text-lg tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">LinkHub</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-muted-foreground hover:bg-black/5 hover:text-black rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div>
              <Avatar className="h-8 w-8 border border-black/10">
                <AvatarFallback className="bg-black text-white text-xs font-bold">
                  {adminUser?.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

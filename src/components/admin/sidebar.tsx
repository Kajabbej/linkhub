"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  Link as LinkIcon,
  Image as ImageIcon,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminUser, clearSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const navItems = [
  { name: "Home", href: "/admin", icon: LayoutDashboard },
  { name: "Profil", href: "/admin/profile", icon: User },
  { name: "Link", href: "/admin/links", icon: LinkIcon },
  { name: "Banner", href: "/admin/banners", icon: ImageIcon },
  { name: "Statistik", href: "/admin/stats", icon: BarChart3 },
  { name: "Pengaturan", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setUser(getAdminUser());
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Gagal melakukan sign out dari Supabase:", err);
    }
    clearSession();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white/50 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
            <LinkIcon size={18} strokeWidth={2.5} />
          </div>
          LinkHub
        </Link>
      </div>

      <Separator className="opacity-50" />

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-black/5 text-black"
                    : "text-muted-foreground hover:bg-black/5 hover:text-black"
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-xl bg-black/5 p-3">
          <Avatar className="h-9 w-9 border border-black/10">
            <AvatarFallback className="bg-white text-black text-xs font-bold">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold">{user?.name || "Admin"}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email || "admin@linkhub.com"}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-black transition-colors p-1 rounded-md hover:bg-black/5 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

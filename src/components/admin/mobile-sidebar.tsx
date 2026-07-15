"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:bg-black/5 hover:text-black transition-colors cursor-pointer outline-none">
        <Menu size={24} />
        <span className="sr-only">Toggle Menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-r-0 bg-transparent">
        <SheetTitle className="sr-only">Navigasi Admin</SheetTitle>
        <div className="h-full bg-white">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}

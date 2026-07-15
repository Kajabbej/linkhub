import { Sidebar } from "@/components/admin/sidebar";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-slate-900 selection:bg-black/10">
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
            <div className="md:hidden font-bold text-lg tracking-tight">LinkHub</div>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 text-muted-foreground hover:bg-black/5 hover:text-black rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>
            <div className="md:hidden">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-black text-white text-xs">B</AvatarFallback>
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

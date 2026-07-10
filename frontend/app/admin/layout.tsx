"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Wallet, 
  Users, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  X,
  BarChart3,
  Shield,
  MessageSquare,
  UserCheck,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, isLoading, router, mounted]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-purple-500/10 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-sm text-white/30 font-medium tracking-wide">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: ShoppingBag, label: "Orders", href: "/admin/orders" },
    { icon: BarChart3, label: "Services", href: "/admin/services" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: UserCheck, label: "Resellers", href: "/admin/resellers" },
    { icon: DollarSign, label: "Deposits", href: "/admin/deposits" },
    { icon: Wallet, label: "Wallet", href: "/admin/wallet" },
    { icon: MessageSquare, label: "Support", href: "/admin/support" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-dashboard flex">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="orb orb-blue" />
        <div className="orb orb-purple" />
        <div className="orb orb-cyan" />
      </div>

      <aside className={`${isSidebarOpen ? "w-64" : "w-[4.5rem]"} transition-all duration-300 glass-sidebar flex flex-col z-10 relative`}>
        <div className="p-5 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/25">
                <Shield size={17} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-base text-gradient tracking-tight block leading-none">Admin Panel</span>
                <span className="text-[10px] text-white/25 font-medium tracking-widest uppercase">Management</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white/25 hover:text-white/60 hover:bg-white/[0.04] rounded-xl">
            {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </Button>
        </div>

        <div className="mx-3 mb-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <nav className="flex-1 px-2.5 space-y-0.5">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                  active
                    ? "text-white"
                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
                }`}
              >
                {active && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-transparent border border-blue-500/10" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                  </>
                )}
                <item.icon size={18} className={`relative z-10 min-w-[18px] transition-colors ${active ? "text-blue-400" : ""}`} />
                {isSidebarOpen && (
                  <span className="relative z-10 ml-3 text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mx-2.5 mb-3">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-3" />
          <Button variant="ghost" className="w-full justify-start text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all rounded-xl mb-1" onClick={() => router.push("/dashboard")}>
            <LayoutDashboard size={18} className="min-w-[18px]" />
            {isSidebarOpen && <span className="ml-3 text-sm font-medium">User Panel</span>}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white/25 hover:text-red-400 hover:bg-red-500/[0.06] transition-all rounded-xl" onClick={logout}>
            <LogOut size={18} className="min-w-[18px]" />
            {isSidebarOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden z-10 relative">
        <header className="h-16 glass-header flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500/50 animate-ping" />
            </div>
            <h2 className="text-sm font-semibold text-white/60">
              {menuItems.find(m => isActive(m.href))?.label || "Admin"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-white/35 hover:text-white/70 hover:bg-white/[0.04] rounded-xl">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full glow-pulse" />
            </Button>
            
            <div className="w-px h-6 bg-white/[0.06]" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white/70 leading-none">{user?.username || "Admin"}</p>
                <p className="text-[11px] text-white/30 mt-1 font-medium capitalize">{user?.role?.replace("_", " ") || "User"}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-red-500/25 ring-1 ring-white/10">
                {user?.username?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

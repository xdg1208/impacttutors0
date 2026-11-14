"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu,
  X,
  User as UserIcon,
  Home
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

interface DashboardNavProps {
  profile: any;
}

export function DashboardSidebar({ profile }: DashboardNavProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dashboardBase = `/dashboard/${profile?.role || "student"}`;

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: dashboardBase },
    { label: "My Courses", icon: <BookOpen size={20} />, href: `${dashboardBase}#courses` },
    { label: "Schedule", icon: <Calendar size={20} />, href: `${dashboardBase}#schedule` },
    { label: "Settings", icon: <Settings size={20} />, href: `${dashboardBase}/settings` },
    { label: "Return Home", icon: <Home size={20} />, href: "/" },
  ];

  return (
    <>
      {/* Mobile Header (Side-effect: open sidebar) */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center justify-between md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">I</div>
          <span className="font-bold text-lg">ImpactTutors</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-muted hover:text-foreground"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-all">I</div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
              Impact<span className="text-primary">Tutors</span>
            </span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-foreground hover:bg-section transition-all"
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm"
          >
            <LogOut size={20} />
            Sign Out
          </button>
          <a
            href="https://studio.acagenie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1 text-[10px] text-muted/40 hover:text-primary/60 transition-colors duration-300"
          >
            Developed by <span className="font-semibold">AcaGenie Studio</span>
          </a>
        </div>
      </aside>
    </>
  );
}

export function DashboardHeader({ profile }: DashboardNavProps) {
  return (
    <header className="hidden md:flex h-16 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 px-8 items-center justify-between w-full">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        Impact Tutors Workspace
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-bold truncate max-w-[120px]">{profile?.full_name}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{profile?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}


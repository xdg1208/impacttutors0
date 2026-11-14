"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BARE_ROUTES = ["/dashboard", "/login", "/signup", "/forgot-password"];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide Navbar/Footer on dashboard and auth routes
  const isBare = BARE_ROUTES.some((r) => pathname?.startsWith(r));

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

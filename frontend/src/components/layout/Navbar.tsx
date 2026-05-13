"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Menu, X, ChevronRight, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Become a Student", href: "/student/apply" },
  { name: "Become a Tutor", href: "/tutor/apply" },
  { name: "How it Works", href: "/how-it-works" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const checkUser = async () => {
      try {
        const res = await fetch('/api/profiles/me/');
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;

  const toggleTheme = () => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-md py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
            <Image
              src="/images/logo.jpg"
              alt="Impact Tutors Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Lora', serif" }}>
            Impact <span className="text-primary">Tutors</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="nav-link-underline text-sm font-semibold text-muted hover:text-primary transition-colors duration-300"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
            aria-label="Toggle theme"
          >
            {mounted && currentTheme === "dark" ? (
              <Sun size={18} className="text-accent" />
            ) : (
              <Moon size={18} className="text-muted" />
            )}
          </button>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 flex items-center gap-2 group"
          >
            {user ? "Open Dashboard" : "Get Dashboard"}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border hover:bg-primary/5 transition-all"
            aria-label="Toggle theme"
          >
            {mounted && currentTheme === "dark" ? (
              <Sun size={18} className="text-accent" />
            ) : (
              <Moon size={18} className="text-muted" />
            )}
          </button>
          <button
            className="text-foreground hover:text-primary transition-colors p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl shadow-lg"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-1 h-screen">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="py-3 px-4 text-base font-semibold text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href={user ? "/dashboard" : "/login"}
                className="mt-4 w-full py-4 bg-primary text-white text-center rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                onClick={() => setIsOpen(false)}
              >
                {user ? "Open Dashboard" : "Get Dashboard"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

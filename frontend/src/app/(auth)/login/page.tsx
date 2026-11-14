"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signIn } from "@/app/actions/auth";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // If server action returned a redirect path, perform a full navigation
    if (result?.redirectPath) {
      window.location.href = result.redirectPath;
      return;
    }

    // Last-resort: reload to ensure cookies are applied
    window.location.reload();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className="p-3.5 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold rounded-xl">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">
            Email Address
          </label>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={16}
            />
            <input
              name="email"
              type="email"
              required
              placeholder="john@example.com"
              className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={16}
            />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full pl-11 pr-12 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
      >
        {loading ? "Signing In..." : "Log In"}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Left: Full-height image panel (fixed to viewport, never scrolls) */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full shrink-0">
        <Image
          src="/images/hero2.png"
          alt="Student learning"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-primary/30 to-black/20" />
        <div className="absolute bottom-16 left-12 right-12 text-white space-y-4 z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
              <Image
                src="/images/logo.jpg"
                alt="Impact Tutors Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight font-heading">
              Impact <span className="text-primary">Tutors</span>
            </span>
          </Link>
          <h2 className="text-4xl font-bold leading-tight font-heading">
            Welcome Back!
          </h2>
          <p className="text-white/70 leading-relaxed text-lg max-w-md">
            Log in to continue your personalized learning journey with Impact
            Tutors.
          </p>
        </div>
      </div>

      {/* Right: Auth form (scrolls independently) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 bg-background relative">
        <div className="absolute inset-0 dot-pattern opacity-30 -z-10" />

        {/* Top bar with back to website & mobile logo */}
        <div className="w-full flex items-center justify-between mb-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow ring-1 ring-border">
              <Image src="/images/logo.jpg" alt="Impact Tutors Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight font-heading">
              Impact <span className="text-primary">Tutors</span>
            </span>
          </Link>
          <div className="hidden lg:block" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-all duration-200 px-3.5 py-1.5 rounded-full border border-border/70 hover:border-border hover:bg-card shadow-xs group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to website
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto my-auto py-6 animate-fade-in-up">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              Sign In
            </h1>
            <p className="text-muted text-sm">
              Access your Impact Tutors dashboard
            </p>
          </div>

          <Suspense fallback={<div className="text-muted text-sm">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-primary font-bold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom credit */}
        <div className="pt-6 pb-2 flex justify-center">
          <a
            href="https://studio.acagenie.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted/40 hover:text-primary/60 transition-colors duration-300 flex items-center gap-1"
          >
            Developed by <span className="font-semibold">AcaGenie Studio</span>
          </a>
        </div>
      </div>
    </div>
  );
}

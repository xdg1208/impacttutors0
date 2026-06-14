"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
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
    <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 items-stretch animate-fade-in-up">
      {/* Left: Image */}
      <div className="hidden lg:block relative rounded-l-2xl overflow-hidden">
        <Image
          src="/images/hero2.png"
          alt="Student learning"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white space-y-3">
          <h2
            className="text-3xl font-bold"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Welcome Back!
          </h2>
          <p className="text-white/80 leading-relaxed">
            Log in to continue your personalized learning journey with Impact
            Tutors.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="premium-card lg:rounded-r-2xl p-8 md:p-10 flex flex-col justify-center">
        <div className="space-y-2 mb-8">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Sign In
          </h1>
          <p className="text-muted text-sm">
            Access your Impact Tutors dashboard
          </p>
        </div>

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

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-lg text-muted">
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-6 flex items-center justify-center section-alt relative">
      <div className="absolute inset-0 dot-pattern -z-10" />
      <Suspense fallback={<div className="text-muted">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

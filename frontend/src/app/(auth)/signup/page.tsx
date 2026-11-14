"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, Lock, User, GraduationCap, Users, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("role", role);

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Registration auto-logs the user in — go straight to their dashboard.
    if (result?.redirectPath) {
      window.location.href = result.redirectPath;
      return;
    }

    // Auto-login didn't complete — ask them to sign in (no email
    // confirmation flow exists, so don't pretend one does).
    router.push("/login?message=Account created successfully. Please sign in.");
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Left: Full-height image panel (fixed to viewport, never scrolls) */}
      <div className="hidden lg:flex lg:w-[45%] relative h-full shrink-0">
        <Image
          src="/images/hero0.png"
          alt="Student joining Impact Tutors"
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
            Join Impact Tutors
          </h2>
          <p className="text-white/70 leading-relaxed text-lg max-w-md">
            Create your account and start your personalized learning journey today.
          </p>
        </div>
      </div>

      {/* Right: Auth form (scrolls independently) */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-12 xl:px-20 bg-background relative">
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

        <div className="w-full max-w-lg mx-auto my-auto py-6 animate-fade-in-up">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold tracking-tight font-heading">Create Account</h1>
            <p className="text-muted text-sm">Join the Impact Tutors community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 ${
                  role === "student"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <GraduationCap size={22} />
                <span className="text-xs font-bold uppercase tracking-wider">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("tutor")}
                className={`p-3.5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1.5 ${
                  role === "tutor"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Users size={22} />
                <span className="text-xs font-bold uppercase tracking-wider">Tutor</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Benny"
                    className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">+</span>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="1-555-000-0000"
                    className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {role === "student" && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Age</label>
                    <input
                      name="age"
                      type="number"
                      required
                      placeholder="12"
                      className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Grade Level</label>
                    <input
                      name="gradeLevel"
                      type="text"
                      required
                      placeholder="Grade 7"
                      className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">School Level</label>
                    <input
                      name="schoolLevel"
                      type="text"
                      placeholder="e.g. Secondary school, Year 3"
                      className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Curriculum</label>
                    <select
                      name="curriculum"
                      required
                      className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm appearance-none"
                    >
                      <option value="">Select Curriculum</option>
                      <option value="British">British</option>
                      <option value="American">American</option>
                      <option value="Canadian">Canadian</option>
                      <option value="Australian">Australian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {role === "tutor" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Short Bio (for parents to see)</label>
                  <textarea
                    name="tutorBio"
                    rows={3}
                    placeholder="e.g. Certified Math teacher with 8 years of experience preparing students for WAEC/IGCSE."
                    className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm resize-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Country</label>
                <select
                  name="country"
                  className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm appearance-none"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Registration Code Field (Required for all roles) */}
              <div className="animate-fade-in space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Registration Code</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input
                    name="inviteCode"
                    type="text"
                    required
                    placeholder={role === "student" ? "Enter student registration code" : "Enter recruitment code"}
                    className="w-full pl-11 pr-4 py-3.5 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-muted italic ml-1 leading-relaxed">
                  {role === "student" 
                    ? "Registration codes are sent to parents after application approval and payment." 
                    : "Only approved tutors with a valid recruitment code can register."}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? "Creating Account..." : "Sign Up"}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign In
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

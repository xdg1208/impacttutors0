"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, Lock, User, GraduationCap, Users } from "lucide-react";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    } else {
      router.push("/login?message=Check your email to confirm your account");
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-6 flex items-center justify-center section-alt relative">
      <div className="absolute inset-0 dot-pattern -z-10" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 items-stretch animate-fade-in-up">
        {/* Left: Image */}
        <div className="hidden lg:block relative rounded-l-2xl overflow-hidden">
          <Image
            src="/images/hero0.png"
            alt="Student joining Impact Tutors"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-white space-y-3">
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Join Impact Tutors</h2>
            <p className="text-white/80 leading-relaxed">Create your account and start your personalized learning journey today.</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="premium-card lg:rounded-r-2xl p-8 md:p-10 flex flex-col justify-center">
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Create Account</h1>
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
                    placeholder="John Doe"
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
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                  />
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
      </div>
    </div>
  );
}

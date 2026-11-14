"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPassword, resetPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSendOTP(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const emailVal = formData.get("email") as string;
    setEmail(emailVal);

    const result = await forgotPassword(emailVal);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setStep("reset");
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("email", email);

    const result = await resetPassword(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setStep("success");
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Left: Full-height image panel (fixed to viewport, never scrolls) */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full shrink-0">
        <Image
          src="/images/hero1.png"
          alt="Secure Impact Tutors Account"
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
            Account Recovery
          </h2>
          <p className="text-white/70 leading-relaxed text-lg max-w-md">
            Protecting your learning journey. Follow the quick steps to safely recover your account access.
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
          {step === "email" && (
            <>
              <div className="space-y-2 mb-8">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition-colors mb-2"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
                <h1 className="text-3xl font-bold tracking-tight font-heading">
                  Forgot Password?
                </h1>
                <p className="text-muted text-sm">
                  Enter your registered email address to receive a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                {error && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl">
                    {error}
                  </div>
                )}

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? "Sending Code..." : "Send Verification Code"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <div className="space-y-2 mb-8">
                <button
                  onClick={() => setStep("email")}
                  className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition-colors mb-2"
                >
                  <ArrowLeft size={14} /> Use different email
                </button>
                <h1 className="text-3xl font-bold tracking-tight font-heading">
                  Verify & Reset
                </h1>
                <p className="text-muted text-sm">
                  We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. Enter it along with your new password below.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                {error && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* OTP Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">
                      Verification Code (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={16}
                      />
                      <input
                        name="otp"
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm tracking-widest font-mono"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={16}
                      />
                      <input
                        name="newPassword"
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

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        size={16}
                      />
                      <input
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        className="w-full pl-11 pr-12 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </form>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-heading">
                  Password Reset Complete
                </h1>
                <p className="text-muted text-sm max-w-sm mx-auto">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                Sign In Now
              </Link>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary font-bold hover:underline"
              >
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

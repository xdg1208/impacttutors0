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
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-6 flex items-center justify-center section-alt relative">
      <div className="absolute inset-0 dot-pattern -z-10" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 items-stretch animate-fade-in-up">
        {/* Left: Image Panel */}
        <div className="hidden lg:block relative rounded-l-2xl overflow-hidden">
          <Image
            src="/images/hero2.png"
            alt="Secure Access"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-white space-y-3">
            <h2 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Security First</h2>
            <p className="text-white/80 leading-relaxed">Protecting your account is our top priority. Resetting your password takes just a minute.</p>
          </div>
        </div>

        {/* Right: Forgot Password / Reset Logic */}
        <div className="premium-card lg:rounded-r-2xl p-8 md:p-10 flex flex-col justify-center bg-card border border-border">
          {step === "email" && (
            <>
              <div className="mb-8">
                <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition-colors mb-4">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Forgot Password?</h1>
                <p className="text-muted text-sm mt-1">Enter your registered email address to receive a 6-digit verification code.</p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                {error && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 text-sm font-semibold rounded-xl">
                    {error}
                  </div>
                )}

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
              <div className="mb-8">
                <button 
                  onClick={() => setStep("email")}
                  className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-primary transition-colors mb-4"
                >
                  <ArrowLeft size={14} /> Use different email
                </button>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Verify OTP & Reset</h1>
                <p className="text-muted text-sm mt-1">We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. Enter it along with your new password below.</p>
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Verification Code (OTP)</label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
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
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
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
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Password Reset Complete</h1>
                <p className="text-muted text-sm max-w-sm mx-auto">Your password has been successfully updated. You can now sign in with your new credentials.</p>
              </div>
              <Link 
                href="/login" 
                className="inline-block px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                Sign In Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

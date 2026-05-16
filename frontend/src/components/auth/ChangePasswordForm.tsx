"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { changePassword } from "@/app/actions/auth";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="p-8 text-center space-y-4 bg-green-50/50 rounded-2xl border border-green-100 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
          <CheckCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-green-800">Password Updated!</h3>
          <p className="text-green-700/70 text-sm">Your security settings have been successfully updated.</p>
        </div>
        <button 
          onClick={() => setSuccess(false)}
          className="text-sm font-bold text-green-700 hover:underline"
        >
          Need to change it again?
        </button>
      </div>
    );
  }

  return (
    <div className="premium-card rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Shield size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Security Settings</h2>
          <p className="text-xs text-muted font-bold uppercase tracking-widest">Update Your Password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Current Password</label>
          <div className="relative">
            <input 
              name="old_password"
              type={showOld ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
            <button 
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
            >
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">New Password</label>
            <div className="relative">
              <input 
                name="new_password"
                type={showNew ? "text" : "password"}
                required
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-12 py-3 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
              <button 
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Confirm New Password</label>
            <div className="relative">
              <input 
                name="confirm_password"
                type={showNew ? "text" : "password"}
                required
                placeholder="Re-type new password"
                className="w-full pl-10 pr-12 py-3 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-xs animate-shake">
            <AlertCircle size={16} />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
        >
          {loading ? "Updating Securely..." : "Update Password"}
        </button>
      </form>

      <div className="p-4 bg-section-alt/50 rounded-xl border border-border/50">
        <p className="text-[9px] leading-relaxed text-muted uppercase font-bold tracking-tighter">
          Security Note: Changing your password will not log you out of your current session. If you suspect account compromise, please contact support immediately.
        </p>
      </div>
    </div>
  );
}

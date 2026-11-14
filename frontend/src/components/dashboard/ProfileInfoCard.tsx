"use client";

import { useState } from "react";
import { User, Phone, Mail, MapPin, GraduationCap, BookOpen, CheckCircle, AlertCircle, Loader2, Save } from "lucide-react";
import { updateProfile } from "@/app/actions/profile";

interface ProfileInfoCardProps {
  profile: any;
}

/**
 * Read-only profile overview + editable basics (name, phone).
 * Administrative fields (role, onboarding status) are display-only.
 */
export default function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(profile.id, formData);
    if (result.error) setStatus({ type: "error", message: result.error });
    else setStatus({ type: "success", message: "Profile updated." });
    setLoading(false);
  };

  const readOnlyRows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Mail size={15} />, label: "Email", value: profile.email || "N/A" },
    { icon: <MapPin size={15} />, label: "Country", value: profile.country || "N/A" },
    ...(profile.role === "student"
      ? [
          { icon: <GraduationCap size={15} />, label: "Grade Level", value: profile.grade_level || "N/A" },
          { icon: <BookOpen size={15} />, label: "Curriculum", value: profile.curriculum || "N/A" },
          ...(profile.school_level
            ? [{ icon: <BookOpen size={15} />, label: "School Level", value: profile.school_level }]
            : []),
        ]
      : []),
    ...(profile.role === "tutor" && profile.tutor_bio
      ? [{ icon: <BookOpen size={15} />, label: "Bio", value: profile.tutor_bio }]
      : []),
  ];

  return (
    <div className="premium-card rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <User size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Profile Information</h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
            {profile.role} account · {profile.is_onboarded ? "Active" : "Pending activation"}
          </p>
        </div>
      </div>

      {/* Editable basics */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
              <input
                name="fullName"
                defaultValue={profile.full_name || ""}
                required
                className="w-full pl-10 pr-4 py-3 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
              <input
                name="phone"
                defaultValue={profile.phone || ""}
                placeholder="+234 800 000 0000"
                className="w-full pl-10 pr-4 py-3 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`p-3 rounded-xl flex items-center gap-3 text-sm ${
              status.type === "success"
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20"
            }`}
          >
            {status.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Read-only rows */}
      <div className="pt-4 border-t border-border space-y-3">
        {readOnlyRows.map((row, i) => (
          <div key={i} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-muted flex items-center gap-2 shrink-0">
              {row.icon} {row.label}
            </span>
            <span className="font-bold text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

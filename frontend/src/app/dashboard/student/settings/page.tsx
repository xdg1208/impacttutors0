import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { Shield } from "lucide-react";

export default function StudentSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Account Settings</h1>
        <p className="text-muted text-sm">Manage your account security and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChangePasswordForm />
        </div>
        
        <div className="space-y-6">
          <div className="premium-card rounded-2xl p-6 bg-primary/5 border-primary/10">
            <div className="flex items-center gap-3 text-primary mb-4">
              <Shield size={20} />
              <h3 className="font-bold text-sm">Security Tip</h3>
            </div>
            <p className="text-xs leading-relaxed text-primary/70">
              Use a unique password with a mix of letters, numbers, and symbols to keep your tutoring account safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

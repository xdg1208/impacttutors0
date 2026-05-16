import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { Shield, AlertTriangle } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Admin Settings</h1>
        <p className="text-muted text-sm">System-wide administrative security controls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChangePasswordForm />
        </div>
        
        <div className="space-y-6">
          <div className="premium-card rounded-2xl p-6 bg-amber-50 border-amber-100">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-sm">Admin Access</h3>
            </div>
            <p className="text-xs leading-relaxed text-amber-700/70">
              Your account has full administrative privileges. Ensure your password is extremely strong and never shared with unauthorized personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

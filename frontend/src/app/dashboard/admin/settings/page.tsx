import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import ProfileInfoCard from "@/components/dashboard/ProfileInfoCard";
import { serverApi } from "@/lib/server-api";
import { Shield, AlertTriangle } from "lucide-react";

export default async function AdminSettingsPage() {
  const client = await serverApi.auth();
  const profile: any = await client.get("/profiles/me/").catch(() => null);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Admin Settings</h1>
        <p className="text-muted text-sm">Your admin profile and account security. Platform-wide settings live in the Settings tab of the dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {profile && <ProfileInfoCard profile={profile} />}

        <div className="space-y-6">
          {profile && <ChangePasswordForm />}
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

"use client";

import { useState } from "react";
import { updateGlobalSettings } from "@/app/actions/admin";
import { Save, Link, Check, AlertCircle, Loader2 } from "lucide-react";

interface AdminSettingsPanelProps {
  settings: {
    id: number;
    whatsapp_group_link: string;
  } | null;
}

export default function AdminSettingsPanel({ settings }: AdminSettingsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await updateGlobalSettings(formData);
    
    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings.' });
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="premium-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border bg-section-alt/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Platform Settings</h2>
          <p className="text-sm text-muted">Manage global configuration for tutors and students.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Link size={16} className="text-primary" />
                Tutor WhatsApp Group Link
              </label>
              <input 
                type="url" 
                name="whatsappLink"
                defaultValue={settings?.whatsapp_group_link || ""}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-4 py-3 bg-section-alt border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <p className="text-[11px] text-muted leading-relaxed">
                This link will be displayed to all approved tutors on their dashboard, allowing them to join the official community.
              </p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success' ? 'bg-green-100/50 text-green-700 border border-green-200' : 'bg-red-100/50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? "Saving Changes..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

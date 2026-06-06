"use client";

import { useState } from "react";
import { updateGlobalSettings, syncTelegramChatId } from "@/app/actions/admin";
import { Save, Link, Check, AlertCircle, Loader2, Send, RefreshCw } from "lucide-react";

interface AdminSettingsPanelProps {
  settings: {
    id: number;
    whatsapp_group_link: string;
    student_whatsapp_group_link?: string;
    telegram_chat_id?: string;
  } | null;
}

export default function AdminSettingsPanel({ settings }: AdminSettingsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
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

  const handleSyncTelegram = async () => {
    setSyncLoading(true);
    setMessage(null);
    
    const result = await syncTelegramChatId();
    
    setSyncLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Telegram Chat ID synced!' });
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to sync with Telegram.' });
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="premium-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border bg-section-alt/30">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Platform Settings</h2>
          <p className="text-sm text-muted">Manage global configuration for tutors and students.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            {/* Tutor WhatsApp Link */}
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
                This link will be displayed to all approved tutors on their dashboard.
              </p>
            </div>

            {/* Student WhatsApp Link */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Link size={16} className="text-blue-500" />
                Student WhatsApp Group Link
              </label>
              <input 
                type="url" 
                name="studentWhatsappLink"
                defaultValue={settings?.student_whatsapp_group_link || ""}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-4 py-3 bg-section-alt border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <p className="text-[11px] text-muted leading-relaxed">
                This link will be displayed to all students on their dashboard to prompt them to join the student group.
              </p>
            </div>


            <div className="border-t border-border pt-6 pb-2">
              <label className="text-sm font-bold flex items-center gap-2 mb-4">
                <Send size={16} className="text-blue-500" />
                Telegram Notifications
              </label>
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-blue-800 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.telegram_chat_id ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-xs font-medium text-blue-700">
                      {settings?.telegram_chat_id ? `Active (ID: ${settings.telegram_chat_id})` : "Not Configured"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-blue-600 leading-relaxed italic">
                    To automate setup: 1. Send any message to your bot on Telegram. 2. Click the sync button below.
                  </p>
                  <button 
                    type="button"
                    onClick={handleSyncTelegram}
                    disabled={syncLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-bold text-xs hover:bg-blue-50 transition-all shadow-sm"
                  >
                    {syncLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {syncLoading ? "Syncing..." : "Sync Telegram Chat ID"}
                  </button>
                </div>
              </div>
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

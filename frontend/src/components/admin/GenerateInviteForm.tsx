"use client";

import { useState } from "react";
import { Plus, Check, AlertCircle, Loader2 } from "lucide-react";
import { generateInviteCode } from "@/app/actions/admin";

export default function GenerateInviteForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, code?: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setStatus(null);
    
    try {
      const result = await generateInviteCode(formData);
      if (result.success) {
        setStatus({ type: 'success', message: `Code generated: ${result.code}`, code: result.code });
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to generate code' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-card rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-widest text-muted">Generate Registration Code</h3>
      
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 ${
          status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <div>
            {status.message}
            {status.code && (
              <p className="mt-1 font-mono font-bold text-lg select-all cursor-pointer underline underline-offset-4 decoration-dotted" title="Click to select">
                {status.code}
              </p>
            )}
          </div>
        </div>
      )}

      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input 
          name="email" 
          type="email" 
          placeholder="Recipient's Email (optional)"
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary md:col-span-1" 
        />
        <select 
          name="role" 
          required 
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="student">For Student</option>
          <option value="tutor">For Tutor</option>
        </select>
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {loading ? 'Generating...' : 'Generate Code'}
        </button>
      </form>
      <p className="text-[10px] text-muted">Generate a single-use code to allow a student or tutor to register.</p>
    </div>
  );
}

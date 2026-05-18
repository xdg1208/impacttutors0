"use client";

import { useState } from "react";
import { Calendar, Check, AlertCircle, Loader2, Plus } from "lucide-react";
import { createSession } from "@/app/actions/admin";

interface CreateSessionFormProps {
  courses: any[];
}

export default function CreateSessionForm({ courses }: CreateSessionFormProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setStatus(null);
    
    try {
      const result = await createSession(formData);
      if (result.success) {
        setStatus({ type: 'success', message: 'Session scheduled successfully!' });
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to create session' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-card rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-widest text-muted">Create New Session</h3>
      
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 ${
          status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select name="courseId" required className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="">Select Course *</option>
          {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        
        <input name="title" placeholder="Session Title (e.g. Weekly Review)" required
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        
        <input name="startTime" type="datetime-local" required
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        
        <input name="duration" type="number" placeholder="Duration (min)" defaultValue="60"
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        
        <button 
          type="submit" 
          disabled={loading}
          className="md:col-span-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Scheduling Session...
            </>
          ) : (
            <>
              <Plus size={16} />
              Create Session
            </>
          )} 
        </button>
      </form>
    </div>
  );
}

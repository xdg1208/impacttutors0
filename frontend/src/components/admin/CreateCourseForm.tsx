"use client";

import { useState } from "react";
import { Plus, Check, AlertCircle, Loader2 } from "lucide-react";
import { createCourse } from "@/app/actions/admin";

interface CreateCourseFormProps {
  students: any[];
  tutors: any[];
}

export default function CreateCourseForm({ students, tutors }: CreateCourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setStatus(null);
    
    try {
      const result = await createCourse(formData);
      if (result.success) {
        setStatus({ type: 'success', message: 'Course created successfully!' });
        // Reset form logic if needed, but revalidatePath will refresh the page
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to create course' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: 'A network error occurred.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-card rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-widest text-muted">Create New Course</h3>
      
      {status && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 ${
          status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        }`}>
          {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="title" placeholder="Course Title (e.g. GCSE Math)" required
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        
        <input name="subject" placeholder="Subject (e.g. Mathematics)" required
          className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
        
        <div className="space-y-1">
          <select 
            name="studentIds" 
            multiple 
            required
            className="w-full px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary min-h-[100px]"
          >
            {students?.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
          <p className="text-[9px] text-muted ml-1 font-bold">Hold Ctrl/Cmd to select multiple students</p>
        </div>

        <div className="space-y-4">
           <select name="tutorId" className="w-full px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
            <option value="">Assign Tutor (optional)</option>
            {tutors?.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          
          <input name="meetLink" placeholder="Zoom Meeting Link (optional)"
            className="w-full px-4 py-3 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="md:col-span-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
          {loading ? 'Creating...' : 'Create New Course'}
        </button>
      </form>
      <p className="text-[10px] text-muted">A valid course must have at least one student assigned.</p>
    </div>
  );
}

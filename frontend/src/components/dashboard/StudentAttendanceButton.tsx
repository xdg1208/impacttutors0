"use client";

import { useState } from "react";
import { Check, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { markStudentAttendance } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface StudentAttendanceButtonProps {
  sessionId: string;
  isMarked: boolean;
}

export default function StudentAttendanceButton({ sessionId, isMarked }: StudentAttendanceButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMark() {
    setLoading(true);
    setError(null);
    try {
      const result = await markStudentAttendance(sessionId, feedback);
      if (result.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to mark attendance.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (isMarked) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
        <Check size={12} /> Present
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-1.5"
      >
        Mark Attendance
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 p-4 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Confirm Attendance</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Confirm that you attended this session and the class was successfully held.
          </p>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase flex items-center gap-1">
              <MessageSquare size={10} /> Optional Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Class went well, covered chapter 3"
              className="w-full p-2 bg-section-alt border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary min-h-[50px] resize-none"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1">
              <AlertCircle size={10} /> {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1.5 hover:bg-section-alt text-[10px] font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMark}
              disabled={loading}
              className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Confirm Present
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

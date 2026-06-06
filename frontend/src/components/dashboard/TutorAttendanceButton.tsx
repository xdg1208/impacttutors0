"use client";

import { useState } from "react";
import { Check, CheckCircle2, Loader2, AlertCircle, XCircle } from "lucide-react";
import { markTutorAttendance } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface TutorAttendanceButtonProps {
  sessionId: string;
  isHeld: boolean;
  studentConfirmed: boolean;
  studentName: string;
}

export default function TutorAttendanceButton({ sessionId, isHeld, studentConfirmed, studentName }: TutorAttendanceButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmedStudent, setConfirmedStudent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMark() {
    setLoading(true);
    setError(null);
    try {
      const result = await markTutorAttendance(sessionId, confirmedStudent);
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

  if (isHeld) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 uppercase tracking-wider">
          Class Held
        </span>
        <span className="text-[10px] text-muted-foreground">
          Student: <strong>{studentConfirmed ? "Present" : "Absent"}</strong>
        </span>
      </div>
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Hold Class & Verify Student</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Mark this class as successfully completed and verify the attendance of <strong>{studentName}</strong>.
          </p>
          
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold text-muted uppercase">Student Attendance</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmedStudent(true)}
                className={`py-2 px-3 border rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  confirmedStudent 
                    ? "bg-green-500/10 text-green-600 border-green-500/30 shadow-sm" 
                    : "border-border text-muted-foreground hover:bg-section-alt"
                }`}
              >
                <CheckCircle2 size={14} /> Present
              </button>
              <button
                type="button"
                onClick={() => setConfirmedStudent(false)}
                className={`py-2 px-3 border rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  !confirmedStudent 
                    ? "bg-red-500/10 text-red-600 border-red-500/30 shadow-sm" 
                    : "border-border text-muted-foreground hover:bg-section-alt"
                }`}
              >
                <XCircle size={14} /> Absent
              </button>
            </div>
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
              Complete Class
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

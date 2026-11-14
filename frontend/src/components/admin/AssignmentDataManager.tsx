"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Power,
  CheckCircle,
  AlertCircle,
  Link2,
} from "lucide-react";
import {
  createAssignment,
  toggleAssignment,
  deleteAssignment,
} from "@/app/actions/admin";

interface AssignmentDataManagerProps {
  assignments: any[];
  students: any[];
  tutors: any[];
}

export default function AssignmentDataManager({
  assignments,
  students,
  tutors,
}: AssignmentDataManagerProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const activeAssignments = assignments.filter((a) => a.is_active);
  const endedAssignments = assignments.filter((a) => !a.is_active);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const formData = new FormData(e.currentTarget);
    const result = await createAssignment(formData);

    if (result.success) {
      setStatus({ type: "success", message: "Assignment created." });
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus({ type: "error", message: result.error || "Failed to create assignment." });
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? "end" : "reactivate"} this assignment?`)) return;
    const result = await toggleAssignment(id, !isActive);
    if (result.error) setStatus({ type: "error", message: result.error });
    else setStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment permanently?")) return;
    const result = await deleteAssignment(id);
    if (result.error) setStatus({ type: "error", message: result.error });
    else setStatus(null);
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="premium-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest text-muted flex items-center gap-2">
          <UserPlus size={16} /> Assign a Student to a Tutor
        </h3>

        {status && (
          <div
            className={`p-3.5 rounded-xl flex items-center gap-3 text-sm ${
              status.type === "success"
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20"
            }`}
          >
            {status.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            name="studentId"
            required
            className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select Student *</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <select
            name="tutorId"
            required
            className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select Tutor *</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Create Assignment"}
          </button>
        </form>
      </div>

      {/* Assignments table */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>
            Student–Tutor Assignments
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
            {activeAssignments.length} active · {endedAssignments.length} ended
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            No assignments yet. Pair students with tutors above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-section-alt/50 border-b border-border">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Student</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Tutor</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Assigned</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-section/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {(a.student_name || "?").charAt(0)}
                        </div>
                        <span className="text-sm font-bold">{a.student_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs uppercase">
                          {(a.tutor_name || "?").charAt(0)}
                        </div>
                        <span className="text-sm font-bold">{a.tutor_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : "—"}
                      {a.ended_at && (
                        <span className="block text-[10px]">ended {new Date(a.ended_at).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          a.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {a.is_active ? "Active" : "Ended"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleToggle(a.id, a.is_active)}
                          className={`p-2 rounded-lg transition-all ${
                            a.is_active
                              ? "text-amber-500 hover:bg-amber-50"
                              : "text-green-500 hover:bg-green-50"
                          }`}
                          title={a.is_active ? "End assignment" : "Reactivate assignment"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete assignment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted flex items-center gap-2">
        <Link2 size={12} />
        Assignments track the student–tutor mentoring relationship independently of course enrollment.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, Search, X, Edit3, Users, 
  GraduationCap, Video, MoreVertical, 
  ExternalLink, Save, ArrowRight, Trash2, CheckSquare, Square,
  Loader2
} from "lucide-react";
import { updateCourse, deleteCourse, bulkDeleteCourses } from "@/app/actions/admin";

interface CourseDataManagerProps {
  courses: any[];
  students: any[];
  tutors: any[];
}

export default function CourseDataManager({ courses, students, tutors }: CourseDataManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null); // 'bulk' or courseId

  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tutor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClose = () => setEditingCourse(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCourses.length) setSelectedIds([]);
    else setSelectedIds(filteredCourses.map(c => c.id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    setLoading(id);
    try {
      await deleteCourse(id);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} courses? This action cannot be undone.`)) return;
    setLoading('bulk');
    try {
      await bulkDeleteCourses(selectedIds);
      setSelectedIds([]);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input 
            type="text"
            placeholder="Search courses by title, subject or tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="text-xs font-bold text-muted uppercase tracking-widest">
           {filteredCourses.length} Active Courses
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-primary">{selectedIds.length} courses selected</span>
          </div>
          <button 
            onClick={handleBulkDelete}
            disabled={loading === 'bulk'}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading === 'bulk' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete Selected
          </button>
        </div>
      )}

      {/* Courses List */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-section-alt/50 border-b border-border">
              <th className="px-5 py-3 w-10">
                <button onClick={toggleSelectAll} className="text-muted hover:text-primary transition-colors">
                  {selectedIds.length === filteredCourses.length && filteredCourses.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Course</th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Students</th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Tutor</th>
              <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.map(c => (
                <tr key={c.id} className={`hover:bg-section/5 transition-colors ${selectedIds.includes(c.id) ? 'bg-primary/[0.02]' : ''}`}>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleSelect(c.id)} className={`${selectedIds.includes(c.id) ? 'text-primary' : 'text-muted/40'} hover:text-primary transition-colors`}>
                      {selectedIds.includes(c.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{c.title}</p>
                    <p className="text-[10px] text-muted">{c.subject}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {c.student_names?.map((name: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 bg-primary/5 rounded font-medium text-[9px] text-primary">{name}</span>
                      ))}
                      {(!c.student_names || c.student_names.length === 0) && <span className="text-[10px] text-muted italic">No students</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium">{c.tutor_name || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => setEditingCourse(c)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all"
                        title="Edit Course"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        disabled={loading === c.id}
                        className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all disabled:opacity-50"
                        title="Delete Course"
                      >
                        {loading === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted text-sm italic">No courses matches your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="premium-card w-full max-w-xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Edit Course</h3>
                  <p className="text-[10px] text-muted uppercase tracking-widest font-bold">{editingCourse.title}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form action={async (formData) => { await updateCourse(editingCourse.id, formData); handleClose(); }} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Course Title</label>
                  <input name="title" defaultValue={editingCourse.title} required className="w-full px-4 py-2.5 bg-section border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Subject</label>
                  <input name="subject" defaultValue={editingCourse.subject} required className="w-full px-4 py-2.5 bg-section border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Assigned Tutor</label>
                <select name="tutorId" defaultValue={editingCourse.tutor} className="w-full px-4 py-2.5 bg-section border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer">
                  <option value="">No Tutor Assigned</option>
                  {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">Enrolled Students</label>
                <select name="studentIds" multiple defaultValue={editingCourse.students} className="w-full px-4 py-3 bg-section border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[150px]">
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <p className="text-[9px] text-muted ml-1 font-medium">Hold Ctrl/Cmd to select multiple students.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1 flex items-center gap-1.5">
                  <Video size={10} /> Zoom Link
                </label>
                <input name="meetLink" defaultValue={editingCourse.meet_link} placeholder="https://zoom.us/j/..." className="w-full px-4 py-2.5 bg-section border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted/50" />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={handleClose} className="px-6 py-2.5 rounded-xl border border-border font-bold text-xs hover:bg-section transition-all">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { 
  Users, Mail, Phone, Calendar, ShieldCheck, 
  BookOpen, Search, X, MoreVertical, ExternalLink,
  GraduationCap, Clock, CheckCircle, Activity, Plus
} from "lucide-react";
import { activateAndEnroll, toggleOnboardingStatus } from "@/app/actions/admin";

interface StudentDataManagerProps {
  students: any[];
  courses: any[];
  tutors: any[];
}

export default function StudentDataManager({ students, courses, tutors }: StudentDataManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStudentCourses = (studentId: string) => {
    return courses.filter(c => c.students && c.students.includes(studentId));
  };

  const handleClose = () => setSelectedStudent(null);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input 
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
          <Activity size={14} className="text-primary" />
          {filteredStudents.length} Students Found
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted text-sm premium-card rounded-2xl">
            No students found matching "{searchTerm}".
          </div>
        ) : filteredStudents.map((s) => (
          <div 
            key={s.id} 
            onClick={() => setSelectedStudent(s)}
            className="premium-card rounded-2xl p-5 space-y-4 hover:border-primary/50 cursor-pointer transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                  {s.full_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold group-hover:text-primary transition-colors">{s.full_name}</p>
                  <p className="text-[10px] text-muted">{s.email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${s.is_onboarded ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {s.is_onboarded ? "Active" : "Waitlist"}
              </span>
            </div>
            
            <div className="flex items-center gap-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-muted" />
                <span className="text-[10px] font-bold">{getStudentCourses(s.id).length} Courses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-muted" />
                <span className="text-[10px] font-bold">Grade {s.grade_level || "N/A"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="premium-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedStudent.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>{selectedStudent.full_name}</h3>
                  <p className="text-xs text-muted uppercase tracking-widest font-bold">Student Profile</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<Mail size={16} />} label="Email Address" value={selectedStudent.email} />
                <DetailItem icon={<Phone size={16} />} label="Phone Number" value={selectedStudent.phone || "Not provided"} />
                <DetailItem icon={<Calendar size={16} />} label="Grade Level" value={selectedStudent.grade_level || "N/A"} />
                <DetailItem icon={<ShieldCheck size={16} />} label="Curriculum" value={selectedStudent.curriculum || "N/A"} />
                <DetailItem icon={<Users size={16} />} label="Guardian" value={selectedStudent.guardian_name || "N/A"} />
                <DetailItem icon={<Clock size={16} />} label="Joined Date" value={new Date(selectedStudent.created_at).toLocaleDateString()} />
              </div>

              {/* Management Actions */}
              {!selectedStudent.is_onboarded && (
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-widest">
                    <Activity size={14} /> Activation Required
                  </div>
                  <form action={async (formData) => { await activateAndEnroll(formData); handleClose(); }} className="space-y-3">
                    <input type="hidden" name="studentId" value={selectedStudent.id} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <select name="tutorId" className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-200">
                        <option value="">Select Tutor (optional)</option>
                        {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </select>
                      <input name="courseTitle" placeholder="Course Title (e.g. Science)" className="w-full text-xs bg-white border border-amber-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-amber-200" />
                    </div>
                    <button className="w-full py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-amber-600/20">
                      <CheckCircle size={16} /> Activate & Enroll Student
                    </button>
                  </form>
                </div>
              )}

              {/* Active Courses Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <BookOpen size={14} /> Enrolled Courses
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {getStudentCourses(selectedStudent.id).map((c: any) => (
                    <div key={c.id} className="p-4 bg-section-alt rounded-2xl border border-border border-l-4 border-l-primary flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{c.title}</p>
                        <p className="text-[10px] text-muted">Tutor: {c.tutor_name || "Unassigned"}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded-lg uppercase">Active</span>
                    </div>
                  ))}
                  {getStudentCourses(selectedStudent.id).length === 0 && (
                    <p className="text-xs text-muted italic p-4 bg-section-alt rounded-2xl border border-dashed border-border">
                      This student is not enrolled in any courses yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-section-alt/30 flex items-center justify-between gap-3">
              <button 
                onClick={async () => {
                   if (confirm(`Are you sure you want to ${selectedStudent.is_onboarded ? 'deactivate' : 'activate'} this student?`)) {
                      await toggleOnboardingStatus(selectedStudent.id, !selectedStudent.is_onboarded);
                      handleClose();
                   }
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${selectedStudent.is_onboarded ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-green-50 text-green-600 border border-green-200"}`}
              >
                {selectedStudent.is_onboarded ? "Deactivate Student" : "Quick Activate"}
              </button>
              <button 
                onClick={handleClose}
                className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

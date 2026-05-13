"use client";

import { useState } from "react";
import { 
  GraduationCap, Mail, Phone, BookOpen, Search, X, 
  MoreVertical, ExternalLink, Users, Award, 
  MessageCircle, Star, Activity, Clock, CheckCircle
} from "lucide-react";
import { toggleOnboardingStatus } from "@/app/actions/admin";

interface TutorDataManagerProps {
  tutors: any[];
  courses: any[];
  students: any[];
}

export default function TutorDataManager({ tutors, courses, students }: TutorDataManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTutor, setSelectedTutor] = useState<any | null>(null);

  const filteredTutors = tutors.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTutorStats = (tutorId: string) => {
    const tutorCourses = courses.filter(c => c.tutor === tutorId);
    let totalStudents = 0;
    const studentIds = new Set();
    
    tutorCourses.forEach(c => {
      if (Array.isArray(c.students)) {
        c.students.forEach((sId: string) => studentIds.add(sId));
      }
    });

    return {
      courseCount: tutorCourses.length,
      studentCount: studentIds.size,
      courses: tutorCourses
    };
  };

  const handleClose = () => setSelectedTutor(null);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input 
            type="text"
            placeholder="Search tutors by name or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest">
          <GraduationCap size={14} className="text-primary" />
          {filteredTutors.length} Active Tutors
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTutors.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted text-sm premium-card rounded-2xl">
            No tutors found matching "{searchTerm}".
          </div>
        ) : filteredTutors.map((t) => {
          const stats = getTutorStats(t.id);
          return (
            <div 
              key={t.id} 
              onClick={() => setSelectedTutor(t)}
              className="premium-card rounded-2xl p-5 space-y-4 hover:border-primary/50 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                    {t.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{t.full_name}</p>
                    <p className="text-[10px] text-muted">{t.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.is_onboarded ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {t.is_onboarded ? "Active" : "Waitlist"}
                </span>
              </div>
              
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-muted" />
                  <span className="text-[10px] font-bold">{stats.studentCount} Students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={12} className="text-muted" />
                  <span className="text-[10px] font-bold">{stats.courseCount} Courses</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedTutor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="premium-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between bg-section-alt/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedTutor.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>{selectedTutor.full_name}</h3>
                  <p className="text-xs text-muted uppercase tracking-widest font-bold">Tutor Profile</p>
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
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="Total Students" value={getTutorStats(selectedTutor.id).studentCount} icon={<Users size={14} />} />
                <StatBox label="Active Courses" value={getTutorStats(selectedTutor.id).courseCount} icon={<BookOpen size={14} />} />
                <StatBox label="Experience" value="Expert" icon={<Award size={14} />} />
              </div>

              {/* Detailed Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem icon={<Mail size={16} />} label="Email Address" value={selectedTutor.email} />
                <DetailItem icon={<Phone size={16} />} label="Phone Number" value={selectedTutor.phone || "Not provided"} />
                <DetailItem icon={<Clock size={16} />} label="Timezone" value={selectedTutor.timezone || "Africa/Lagos"} />
                <DetailItem icon={<MessageCircle size={16} />} label="WhatsApp Community" value={selectedTutor.whatsapp_community_url ? "Linked" : "Not Linked"} />
              </div>

              {/* Assignments Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <Activity size={14} /> Assigned Courses & Students
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {getTutorStats(selectedTutor.id).courses.map((c: any) => (
                    <div key={c.id} className="p-4 bg-section-alt rounded-2xl border border-border border-l-4 border-l-primary flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{c.title}</p>
                        <p className="text-[10px] text-muted">{c.student_names?.join(", ") || "No students"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-bold rounded-lg uppercase">{c.subject}</span>
                      </div>
                    </div>
                  ))}
                  {getTutorStats(selectedTutor.id).courseCount === 0 && (
                    <p className="text-xs text-muted italic p-4 bg-section-alt rounded-2xl border border-dashed border-border text-center">
                      No active courses assigned to this tutor.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-section-alt/30 flex items-center justify-between gap-3">
              <button 
                onClick={async () => {
                   if (confirm(`Are you sure you want to ${selectedTutor.is_onboarded ? 'deactivate' : 'activate'} this tutor?`)) {
                      await toggleOnboardingStatus(selectedTutor.id, !selectedTutor.is_onboarded);
                      handleClose();
                   }
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${selectedTutor.is_onboarded ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-green-50 text-green-600 border border-green-200"}`}
              >
                {selectedTutor.is_onboarded ? "Deactivate Tutor" : "Activate Tutor"}
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

function StatBox({ label, value, icon }: { label: string, value: any, icon: any }) {
  return (
    <div className="p-3 bg-section-alt rounded-xl border border-border text-center space-y-1">
      <div className="mx-auto w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-1">
        {icon}
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[9px] uppercase font-bold text-muted tracking-tight">{label}</p>
    </div>
  );
}

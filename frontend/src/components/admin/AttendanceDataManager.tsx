"use client";

import { useState, useMemo } from "react";
import { Search, Activity, User, BookOpen, CheckCircle2, XCircle } from "lucide-react";

interface AttendanceDataManagerProps {
  sessions: any[];
  students: any[];
  tutors: any[];
}

export default function AttendanceDataManager({ sessions, students, tutors }: AttendanceDataManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"students" | "tutors">("students");

  // Calculate stats for students
  const studentStats = useMemo(() => {
    return students.map(student => {
      const studentSessions = sessions.filter(s => s.student === student.id);
      const totalSessions = studentSessions.length;
      const attended = studentSessions.filter(s => s.student_marked_present || s.tutor_confirmed_student).length;
      const attendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
      
      return {
        id: student.id,
        name: student.full_name,
        totalSessions,
        attended,
        missed: totalSessions - attended,
        attendanceRate,
        courses: Array.from(new Set(studentSessions.map(s => s.course_name)))
      };
    }).filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.courses.some((c: string) => c.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [sessions, students, searchTerm]);

  // Calculate stats for tutors
  const tutorStats = useMemo(() => {
    return tutors.map(tutor => {
      const tutorSessions = sessions.filter(s => s.tutor === tutor.id);
      const totalSessions = tutorSessions.length;
      const held = tutorSessions.filter(s => s.tutor_marked_held).length;
      const completionRate = totalSessions > 0 ? Math.round((held / totalSessions) * 100) : 0;
      
      return {
        id: tutor.id,
        name: tutor.full_name,
        totalSessions,
        held,
        missed: totalSessions - held,
        completionRate,
        courses: Array.from(new Set(tutorSessions.map(s => s.course_name)))
      };
    }).filter(t => 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.courses.some((c: string) => c.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => b.completionRate - a.completionRate);
  }, [sessions, tutors, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-section-alt p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setView("students")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'students' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            Student Attendance
          </button>
          <button 
            onClick={() => setView("tutors")}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${view === 'tutors' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            Tutor Reliability
          </button>
        </div>
        
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted h-4 w-4" />
          <input 
            type="text"
            placeholder={`Search ${view}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-4 rounded-xl border border-border bg-card">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Average Rate</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold">
              {view === "students" 
                ? (studentStats.length ? Math.round(studentStats.reduce((acc, curr) => acc + curr.attendanceRate, 0) / studentStats.length) : 0)
                : (tutorStats.length ? Math.round(tutorStats.reduce((acc, curr) => acc + curr.completionRate, 0) / tutorStats.length) : 0)}%
            </span>
            <Activity className="text-primary mb-1" size={20} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-section-alt/50 border-b border-border">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Profile</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Courses</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-center">Sessions</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-center">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {view === "students" ? (
                studentStats.map(stat => (
                  <tr key={stat.id} className="hover:bg-section/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {stat.name.charAt(0)}
                        </div>
                        <span className="font-bold text-sm">{stat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {stat.courses.length > 0 ? stat.courses.map((c: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-section-alt rounded-full text-muted-foreground">{c}</span>
                        )) : <span className="text-xs text-muted italic">No active courses</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-green-600" title="Attended">
                          <CheckCircle2 size={14} /> {stat.attended}
                        </div>
                        <div className="flex items-center gap-1.5 text-red-500" title="Missed">
                          <XCircle size={14} /> {stat.missed}
                        </div>
                        <div className="text-muted" title="Total">
                           / {stat.totalSessions}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-section-alt"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={stat.attendanceRate >= 80 ? "text-green-500" : stat.attendanceRate >= 50 ? "text-amber-500" : "text-red-500"}
                              strokeDasharray={`${stat.attendanceRate}, 100`}
                              strokeWidth="3"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-bold">{stat.attendanceRate}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                tutorStats.map(stat => (
                  <tr key={stat.id} className="hover:bg-section/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                          {stat.name.charAt(0)}
                        </div>
                        <span className="font-bold text-sm">{stat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {stat.courses.length > 0 ? stat.courses.map((c: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-section-alt rounded-full text-muted-foreground">{c}</span>
                        )) : <span className="text-xs text-muted italic">No active courses</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-green-600" title="Held">
                          <CheckCircle2 size={14} /> {stat.held}
                        </div>
                        <div className="flex items-center gap-1.5 text-red-500" title="Missed">
                          <XCircle size={14} /> {stat.missed}
                        </div>
                        <div className="text-muted" title="Total">
                           / {stat.totalSessions}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-section-alt"
                              strokeWidth="3"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={stat.completionRate >= 80 ? "text-green-500" : stat.completionRate >= 50 ? "text-amber-500" : "text-red-500"}
                              strokeDasharray={`${stat.completionRate}, 100`}
                              strokeWidth="3"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-[10px] font-bold">{stat.completionRate}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {((view === "students" && studentStats.length === 0) || (view === "tutors" && tutorStats.length === 0)) && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted text-sm italic">
                    No stats found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { 
  Users, GraduationCap, BookOpen, Activity, Calendar, Video, RefreshCw, Loader2
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api"
import ApplicationDetailManager from "@/components/admin/ApplicationDetailManager";
import StudentDataManager from "@/components/admin/StudentDataManager";
import TutorDataManager from "@/components/admin/TutorDataManager";
import CourseDataManager from "@/components/admin/CourseDataManager";
import SessionDataManager from "@/components/admin/SessionDataManager";
import ContactMessageManager from "@/components/admin/ContactMessageManager";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import CreateCourseForm from "@/components/admin/CreateCourseForm";
import CreateSessionForm from "@/components/admin/CreateSessionForm";
import GenerateInviteForm from "@/components/admin/GenerateInviteForm";
import { MoreVertical } from "lucide-react";
import { deleteInviteCode } from "@/app/actions/admin";

interface AdminDashboardContentProps {
  initialTab: string;
  initialQuery: string;
  token?: string;
}

export default function AdminDashboardContent({ initialTab, initialQuery, token }: AdminDashboardContentProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    students: [],
    tutors: [],
    courses: [],
    sessions: [],
    tutorApps: [],
    studentApps: [],
    inviteCodes: [],
    contactMessages: [],
    settings: null,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        allProfiles,
        fetchedTutorApps,
        fetchedStudentApps,
        fetchedInvites,
        fetchedMessages,
        fetchedCourses,
        fetchedSessions,
        fetchedSettings
      ] = await Promise.all([
        api.get("/profiles/", { token }).catch(() => []),
        api.get("/tutor-applications/", { token }).catch(() => []),
        api.get("/student-applications/", { token }).catch(() => []),
        api.get("/invites/", { token }).catch(() => []),
        api.get("/contact-messages/", { token }).catch(() => []),
        api.get("/courses/", { token }).catch(() => []),
        api.get("/sessions/", { token }).catch(() => []),
        api.get("/settings/", { token }).catch(() => null),
      ]);

      setData({
        students: (allProfiles as any[]).filter(p => p.role === 'student'),
        tutors: (allProfiles as any[]).filter(p => p.role === 'tutor'),
        tutorApps: fetchedTutorApps as any[],
        studentApps: fetchedStudentApps as any[],
        inviteCodes: fetchedInvites as any[],
        contactMessages: fetchedMessages as any[],
        courses: fetchedCourses as any[],
        sessions: fetchedSessions as any[],
        settings: fetchedSettings as any,
      });
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { tab = initialTab, q = initialQuery } = { tab: initialTab, q: initialQuery };

  // Filter data based on query
  let filteredStudents = data.students;
  let filteredTutors = data.tutors;
  let filteredCourses = data.courses;

  if (q) {
    const query = q.toLowerCase();
    filteredStudents = data.students.filter((s: any) => s.full_name?.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query));
    filteredTutors = data.tutors.filter((t: any) => t.full_name?.toLowerCase().includes(query) || t.email?.toLowerCase().includes(query));
    filteredCourses = data.courses.filter((c: any) => c.title?.toLowerCase().includes(query) || c.subject?.toLowerCase().includes(query));
  }

  const pendingTutorApps = data.tutorApps.filter((a: any) => a.status === 'pending').length;
  const pendingStudentApps = data.studentApps.filter((a: any) => a.status === 'pending').length;
  const totalPendingApps = pendingTutorApps + pendingStudentApps;

  const tabs = [
    { key: "applications", label: "Applications", count: totalPendingApps },
    { key: "students", label: "Students", count: data.students.length },
    { key: "tutors", label: "Tutors", count: data.tutors.length },
    { key: "invites", label: "Registration Codes" },
    { key: "inquiries", label: "Inquiries", count: data.contactMessages.length },
    { key: "courses", label: "Courses", count: data.courses.length },
    { key: "sessions", label: "Sessions" },
    { key: "settings", label: "Settings" },
  ];

  if (loading) {
     return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 animate-pulse">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-muted text-sm font-medium">Synchronizing with control center...</p>
        </div>
     );
  }

  if (error) {
    return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 text-center">
            <div className="bg-red-50 p-4 rounded-full text-red-500"><Activity size={32} /></div>
            <div className="space-y-1">
                <h3 className="font-bold text-lg">Unable to load dashboard data</h3>
                <p className="text-muted text-sm max-w-sm">{error}</p>
            </div>
            <button onClick={fetchData} className="px-6 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2">
                <RefreshCw size={16} /> Retry
            </button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data.students.length} icon={<Users size={20} />} color="text-blue-600" />
        <StatCard title="Active Tutors" value={data.tutors.length} icon={<GraduationCap size={20} />} color="text-purple-600" />
        <StatCard title="Applications" value={totalPendingApps} icon={<Activity size={20} />} color="text-amber-600" />
        <StatCard title="Live Courses" value={data.courses.length} icon={<BookOpen size={20} />} color="text-green-600" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <Link key={t.key} href={`?tab=${t.key}${q ? `&q=${q}` : ''}`} className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-all relative ${tab === t.key ? "text-primary" : "text-muted hover:text-foreground"}`}>
              {t.label}
              {t.count != null && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-md">{t.count}</span>}
              {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
            </Link>
          ))}
        </div>

        {/* ========== APPLICATIONS TAB ========== */}
        {tab === "applications" && (
          <ApplicationDetailManager 
            studentApps={data.studentApps} 
            tutorApps={data.tutorApps} 
          />
        )}

        {/* ========== INVITES TAB ========== */}
        {tab === "invites" && (
          <div className="space-y-6">
            <GenerateInviteForm />
            <div className="premium-card rounded-2xl p-0 overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Active Registration Codes</h2>
              </div>
              {data.inviteCodes.length === 0 ? (
                <div className="p-12 text-center text-muted text-sm">No active codes.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-section-alt/50 border-b border-border">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Code</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Role</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Target Email</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Status</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {data.inviteCodes.map((code: any) => (
                        <tr key={code.id} className="hover:bg-section/5 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-sm text-primary">{code.code}</td>
                          <td className="px-5 py-4 text-xs capitalize">{code.role}</td>
                          <td className="px-5 py-4 text-xs text-muted">{code.target_email || "Any"}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${code.is_used ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                              {code.is_used ? "Used" : "Available"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <form action={async () => { await deleteInviteCode(code.id); fetchData(); }}>
                                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                  <MoreVertical size={14} />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== STUDENTS TAB ========== */}
        {tab === "students" && (
          <StudentDataManager 
            students={filteredStudents} 
            courses={data.courses} 
            tutors={data.tutors} 
          />
        )}

        {/* ========== TUTORS TAB ========== */}
        {tab === "tutors" && (
          <TutorDataManager 
            tutors={filteredTutors} 
            courses={data.courses} 
            students={data.students} 
          />
        )}

        {/* ========== COURSES TAB ========== */}
        {tab === "courses" && (
          <div className="space-y-6">
            <CreateCourseForm students={data.students} tutors={data.tutors} />
            <CourseDataManager 
              courses={filteredCourses} 
              students={data.students} 
              tutors={data.tutors} 
            />
          </div>
        )}

        {/* ========== SESSIONS TAB ========== */}
        {tab === "sessions" && (
          <div className="space-y-6">
            <CreateSessionForm courses={data.courses} />
            <SessionDataManager sessions={data.sessions} />
          </div>
        )}

        {/* ========== INQUIRIES TAB ========== */}
        {tab === "inquiries" && (
          <ContactMessageManager messages={data.contactMessages} />
        )}

        {/* ========== SETTINGS TAB ========== */}
        {tab === "settings" && (
          <AdminSettingsPanel settings={data.settings} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="premium-card rounded-2xl p-5 group hover:border-primary/30 transition-all shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-section-alt group-hover:bg-primary/5 transition-colors ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

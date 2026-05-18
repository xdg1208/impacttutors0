import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { 
  Check, Users, GraduationCap, BookOpen, UserCheck,
  Plus, MoreVertical, Activity, ArrowRight, Calendar, Video, X
} from "lucide-react";
import { 
  approveApplication, rejectApplication, generateInviteCode, deleteInviteCode, 
  createCourse, createSession, toggleOnboardingStatus, activateAndEnroll
} from "@/app/actions/admin";
import ApplicationDetailManager from "@/components/admin/ApplicationDetailManager";
import StudentDataManager from "@/components/admin/StudentDataManager";
import TutorDataManager from "@/components/admin/TutorDataManager";
import CourseDataManager from "@/components/admin/CourseDataManager";
import SessionDataManager from "@/components/admin/SessionDataManager";
import ContactMessageManager from "@/components/admin/ContactMessageManager";
import CreateCourseForm from "@/components/admin/CreateCourseForm";
import CreateSessionForm from "@/components/admin/CreateSessionForm";
import GenerateInviteForm from "@/components/admin/GenerateInviteForm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string, q?: string }> }) {
  const { tab = "applications", q = "" } = await searchParams;
  const client = await api.auth();

  let profile: any = null;
  let shouldRedirect = false;

  try {
    profile = await client.get("/profiles/me/");
  } catch (error) {
    shouldRedirect = true;
  }

  if (shouldRedirect || !profile) {
    redirect("/login");
  }

  // Role Guard
  if (profile.role !== "admin") {
    redirect(`/dashboard/${profile.role}`);
  }

  // Data fetching - PARALLELIZED to prevent waterfall timeouts
  let students: any[] = [];
  let tutors: any[] = [];
  let courses: any[] = [];
  let sessions: any[] = [];
  let tutorApps: any[] = [];
  let studentApps: any[] = [];
  let inviteCodes: any[] = [];
  let contactMessages: any[] = [];

  try {
    const [
      allProfiles,
      fetchedTutorApps,
      fetchedStudentApps,
      fetchedInvites,
      fetchedMessages,
      fetchedCourses,
      fetchedSessions
    ] = await Promise.all([
      client.get("/profiles/").catch(() => []),
      client.get("/tutor-applications/").catch(() => []),
      client.get("/student-applications/").catch(() => []),
      client.get("/invites/").catch(() => []),
      client.get("/contact-messages/").catch(() => []),
      client.get("/courses/").catch(() => []),
      client.get("/sessions/").catch(() => []),
    ]);

    students = (allProfiles as any[]).filter(p => p.role === 'student');
    tutors = (allProfiles as any[]).filter(p => p.role === 'tutor');
    tutorApps = fetchedTutorApps as any[];
    studentApps = fetchedStudentApps as any[];
    inviteCodes = fetchedInvites as any[];
    contactMessages = fetchedMessages as any[];
    courses = fetchedCourses as any[];
    sessions = fetchedSessions as any[];

    // Local Search Filtering (Scalability - Client Side Filter logic for now)
    if (q) {
      const query = q.toLowerCase();
      students = students.filter(s => s.full_name?.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query));
      tutors = tutors.filter(t => t.full_name?.toLowerCase().includes(query) || t.email?.toLowerCase().includes(query));
      courses = courses.filter(c => c.title?.toLowerCase().includes(query) || c.subject?.toLowerCase().includes(query));
    }
  } catch (error) {
    console.error("Error fetching admin data:", error);
  }

  const studentCount = students.length;
  const tutorCount = tutors.length;
  const pendingTutorApps = tutorApps.filter((a: any) => a.status === 'pending').length;
  const pendingStudentApps = studentApps.filter((a: any) => a.status === 'pending').length;
  const totalPendingApps = pendingTutorApps + pendingStudentApps;
  const courseCount = courses.length;

  const tabs = [
    { key: "applications", label: "Applications", count: totalPendingApps },
    { key: "students", label: "Students", count: studentCount },
    { key: "tutors", label: "Tutors", count: tutorCount },
    { key: "invites", label: "Registration Codes" },
    { key: "inquiries", label: "Inquiries", count: contactMessages.length },
    { key: "courses", label: "Courses", count: courseCount },
    { key: "sessions", label: "Sessions" },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>Admin Control Center</h1>
          <p className="text-muted text-sm">Manage applications, users, and academics.</p>
        </div>
        <form className="relative max-w-sm w-full" action="/dashboard/admin" method="GET">
          <input 
            type="text" 
            name="q"
            placeholder="Search everywhere..."
            defaultValue={q}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
          <input type="hidden" name="tab" value={tab} />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <button type="submit" className="hidden" />
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={studentCount} icon={<Users size={20} />} color="text-blue-600" />
        <StatCard title="Active Tutors" value={tutorCount} icon={<GraduationCap size={20} />} color="text-purple-600" />
        <StatCard title="Applications" value={totalPendingApps} icon={<Activity size={20} />} color="text-amber-600" />
        <StatCard title="Live Courses" value={courseCount} icon={<BookOpen size={20} />} color="text-green-600" />
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
            studentApps={studentApps} 
            tutorApps={tutorApps} 
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
              {!inviteCodes || inviteCodes.length === 0 ? (
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
                      {inviteCodes.map((code) => (
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
                              <form action={async () => { "use server"; await deleteInviteCode(code.id); }}>
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
            students={students} 
            courses={courses} 
            tutors={tutors} 
          />
        )}

        {/* ========== TUTORS TAB ========== */}
        {tab === "tutors" && (
          <TutorDataManager 
            tutors={tutors} 
            courses={courses} 
            students={students} 
          />
        )}

        {/* ========== COURSES TAB ========== */}
        {tab === "courses" && (
          <div className="space-y-6">
            <CreateCourseForm students={students} tutors={tutors} />
            <CourseDataManager 
              courses={courses} 
              students={students} 
              tutors={tutors} 
            />
          </div>
        )}

        {/* ========== SESSIONS TAB ========== */}
        {tab === "sessions" && (
          <div className="space-y-6">
            <CreateSessionForm courses={courses} />
            <SessionDataManager sessions={sessions} />
          </div>
        )}

        {/* ========== INQUIRIES TAB ========== */}
        {tab === "inquiries" && (
          <ContactMessageManager messages={contactMessages} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="premium-card rounded-2xl p-5 group hover:border-primary/30 transition-all">
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

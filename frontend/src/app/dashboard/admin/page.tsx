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

  // Data fetching
  let students: any[] = [];
  let tutors: any[] = [];
  let courses: any[] = [];
  let sessions: any[] = [];
  let tutorApps: any[] = [];
  let studentApps: any[] = [];
  let inviteCodes: any[] = [];

  try {
    // Optimized: Fetch only required data if possible, but for now we filter locally
    const allProfiles: any[] = await client.get("/profiles/");
    students = allProfiles.filter(p => p.role === 'student');
    tutors = allProfiles.filter(p => p.role === 'tutor');
    
    tutorApps = (await client.get("/tutor-applications/").catch(() => [])) as any[];
    studentApps = (await client.get("/student-applications/").catch(() => [])) as any[];
    inviteCodes = (await client.get("/invites/").catch(() => [])) as any[];
    courses = (await client.get("/courses/").catch(() => [])) as any[];
    sessions = (await client.get("/sessions/").catch(() => [])) as any[];

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
          <div className="space-y-6">
            <div className="premium-card rounded-2xl p-0 overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Pending Student Applications</h2>
              </div>
              {!studentApps || studentApps.length === 0 ? (
                <div className="p-12 text-center text-muted text-sm">No pending student applications.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-section-alt/50 border-b border-border">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Student / Parent</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Grade / Curriculum</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {studentApps.filter(a => a.status === 'pending').map((app) => (
                        <tr key={app.id} className="hover:bg-section/5 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold">{app.student_name}</p>
                            <p className="text-[11px] text-muted">{app.parent_name} • {app.email}</p>
                          </td>
                          <td className="px-5 py-4 text-xs">
                            {app.grade_level} • {app.curriculum}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <form action={async () => { "use server"; await approveApplication(app.id, 'student'); }}>
                                <button className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5">
                                  <Check size={14} /> Approve
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

            <div className="premium-card rounded-2xl p-0 overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Lora', serif" }}>Pending Tutor Applications</h2>
              </div>
              {!tutorApps || tutorApps.length === 0 ? (
                <div className="p-12 text-center text-muted text-sm">No pending tutor applications.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-section-alt/50 border-b border-border">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Applicant</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Bio Snippet</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {tutorApps.filter(a => a.status === 'pending').map((app) => (
                        <tr key={app.id} className="hover:bg-section/5 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold">{app.full_name}</p>
                            <p className="text-[11px] text-muted">{app.email}</p>
                          </td>
                          <td className="px-5 py-4 text-xs text-muted truncate max-w-[200px]">
                            {app.experience}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <form action={async () => { "use server"; await approveApplication(app.id, 'tutor'); }}>
                                <button className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5">
                                  <Check size={14} /> Approve
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

        {/* ========== INVITES TAB ========== */}
        {tab === "invites" && (
          <div className="space-y-6">
            <div className="premium-card rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted">Generate Registration Code</h3>
              <form action={async (formData) => { "use server"; await generateInviteCode(formData); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="email" type="email" placeholder="Recipient's Email (optional)"
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary md:col-span-1" />
                <select name="role" required className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="student">For Student</option>
                  <option value="tutor">For Tutor</option>
                </select>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2">
                  <Plus size={16} /> Generate Code
                </button>
              </form>
              <p className="text-[10px] text-muted">Generate a single-use code to allow a student or tutor to register.</p>
            </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!students || students.length === 0) ? (
              <div className="col-span-full p-12 text-center text-muted text-sm premium-card rounded-2xl ">No students found.</div>
            ) : students.map((s) => (
              <div key={s.id} className="premium-card rounded-2xl p-5 space-y-3 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{s.full_name?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold">{s.full_name}</p>
                      <p className="text-[10px] text-muted">{s.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${s.is_onboarded ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.is_onboarded ? "Active" : "Waitlist"}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                   <p className="text-[10px] text-muted">Grade {s.grade_level || "7"} • British</p>
                    {!s.is_onboarded && (
                      <div className="space-y-2 mt-2 pt-3 border-t border-border/50">
                        <p className="text-[10px] font-bold uppercase text-primary tracking-widest">Activate with Enrollment</p>
                        <form action={async (formData) => { "use server"; await activateAndEnroll(formData); }} className="space-y-2">
                          <input type="hidden" name="studentId" value={s.id} />
                          <div className="flex gap-2">
                            <select name="tutorId" className="flex-1 text-[10px] bg-section border border-border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-primary">
                              <option value="">No Tutor</option>
                              {tutors.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                            </select>
                            <input name="courseTitle" placeholder="Course Title" className="flex-1 text-[10px] bg-section border border-border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-primary" />
                          </div>
                          <button className="w-full py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:shadow-md hover:shadow-primary/20 transition-all">
                            Activate & Enroll
                          </button>
                        </form>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== TUTORS TAB ========== */}
        {tab === "tutors" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!tutors || tutors.length === 0) ? (
              <div className="col-span-full p-12 text-center text-muted text-sm premium-card rounded-2xl">No tutors found.</div>
            ) : tutors.map((t) => (
              <div key={t.id} className="premium-card rounded-2xl p-5 space-y-3 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{t.full_name?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold">{t.full_name}</p>
                      <p className="text-[10px] text-muted">{t.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${t.is_onboarded ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {t.is_onboarded ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="pt-2 border-t border-border">
                   <p className="text-[10px] text-muted">Specializes in Math, Physics</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========== COURSES TAB ========== */}
        {tab === "courses" && (
          <div className="space-y-6">
            <div className="premium-card rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted">Create New Course</h3>
              <form action={async (formData) => { "use server"; await createCourse(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="title" placeholder="Course Title (e.g. GCSE Math)" required
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                <input name="subject" placeholder="Subject (e.g. Mathematics)" required
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                <select name="studentId" className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Assign Student (optional)</option>
                  {students?.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
                <select name="tutorId" className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Assign Tutor (optional)</option>
                  {tutors?.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
                <input name="meetLink" placeholder="Google Meet Link (optional)"
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2">
                  <Plus size={16} /> Create Course
                </button>
              </form>
            </div>

            {!courses || courses.length === 0 ? (
              <div className="premium-card rounded-2xl p-12 text-center text-muted text-sm">No courses found.</div>
            ) : (
              <div className="premium-card rounded-2xl p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-section-alt/50 border-b border-border">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Course</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Student</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Tutor</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Meet</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {courses.map(c => (
                        <tr key={c.id} className="hover:bg-section/5">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold">{c.title}</p>
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">{c.status}</span>
                          </td>
                          <td className="px-5 py-4 text-sm">{c.student_name || "—"}</td>
                          <td className="px-5 py-4 text-sm">{c.tutor_name || "—"}</td>
                          <td className="px-5 py-4 text-xs">
                            {c.meet_link ? <a href={c.meet_link} target="_blank" className="text-primary font-bold hover:underline">Link</a> : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== SESSIONS TAB ========== */}
        {tab === "sessions" && (
          <div className="space-y-6">
            <div className="premium-card rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted">Create New Session</h3>
              <form action={async (formData) => { "use server"; await createSession(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="courseId" required className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select Course *</option>
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <input name="title" placeholder="Session Title" required
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                <input name="startTime" type="datetime-local" required
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                <input name="duration" type="number" placeholder="Duration (min)" defaultValue="60"
                  className="px-4 py-2.5 bg-section border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" />
                <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                  Create Session
                </button>
              </form>
            </div>

            {!sessions || sessions.length === 0 ? (
              <div className="premium-card rounded-2xl p-12 text-center text-muted text-sm">No sessions scheduled.</div>
            ) : (
              <div className="premium-card rounded-2xl p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-section-alt/50 border-b border-border">
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Session</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Date/Time</th>
                      <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border">
                      {sessions.map(s => (
                        <tr key={s.id} className="hover:bg-section/5">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold">{s.title}</p>
                            <p className="text-[10px] text-muted">{s.student_name} with {s.tutor_name}</p>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {new Date(s.start_time).toLocaleString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
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

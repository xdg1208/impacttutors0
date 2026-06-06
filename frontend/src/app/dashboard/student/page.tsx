import { cookies } from "next/headers";
import { api } from "@/lib/api"
import { serverApi } from "@/lib/server-api";
import Link from "next/link";
import { 
  Play, 
  Clock, 
  BookOpen,
  Calendar as CalendarIcon,
  Video,
  User as UserIcon
} from "lucide-react";
import { redirect } from "next/navigation";
import StudentAttendanceButton from "@/components/dashboard/StudentAttendanceButton";

export default async function StudentDashboard() {
  const client = await serverApi.auth();
  
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
  if (profile.role !== "student") {
    redirect(profile.role ? `/dashboard/${profile.role}` : "/dashboard/onboarding");
  }

  // Fetch data in parallel to prevent waterfall
  let courses: any[] = [];
  let sessions: any[] = [];
  let whatsappLink = "";
  
  try {
    const [fetchedCourses, fetchedSessions, fetchedSettings] = await Promise.all([
      client.get("/courses/").catch(() => []),
      client.get("/sessions/", { params: { status: 'scheduled' } }).catch(() => []),
      client.get("/settings/").catch(() => null)
    ]);
    courses = fetchedCourses as any[];
    sessions = fetchedSessions as any[];
    if ((fetchedSettings as any)?.student_whatsapp_group_link) {
      whatsappLink = (fetchedSettings as any).student_whatsapp_group_link;
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  const courseCount = courses?.length || 0;
  const sessionCount = sessions?.length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
            Welcome back, {profile?.full_name?.split(' ')[0] || "Student"}! 📚
          </h1>
          <p className="text-muted mt-1">
            {courseCount > 0
              ? `You have ${courseCount} enrolled course${courseCount > 1 ? 's' : ''} and ${sessionCount} upcoming session${sessionCount !== 1 ? 's' : ''}.`
              : "No courses assigned yet. Your admin is setting things up!"}
          </p>
        </div>
        {sessions && sessions.length > 0 && sessions[0].meet_link && (
          <a 
            href={sessions[0].meet_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 w-fit"
          >
            <Play size={18} fill="currentColor" />
            Join Next Lesson
          </a>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-section rounded-xl"><BookOpen className="text-blue-500" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Enrolled</span>
          </div>
          <p className="text-muted text-sm">Active Courses</p>
          <h3 className="text-3xl font-bold mt-1">{courseCount}</h3>
        </div>
        <div className="premium-card rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-section rounded-xl"><CalendarIcon className="text-emerald-500" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Upcoming</span>
          </div>
          <p className="text-muted text-sm">Scheduled Sessions</p>
          <h3 className="text-3xl font-bold mt-1">{sessionCount}</h3>
        </div>
        <div className="premium-card rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-section rounded-xl"><Clock className="text-amber-500" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Profile</span>
          </div>
          <p className="text-muted text-sm">Grade Level</p>
          <h3 className="text-3xl font-bold mt-1">{profile?.grade_level || "N/A"}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sessions Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Upcoming Sessions</h2>
            {!sessions || sessions.length === 0 ? (
              <div className="premium-card rounded-2xl p-12 text-center border border-border bg-card space-y-3">
                <CalendarIcon className="mx-auto text-muted" size={32} />
                <p className="text-sm text-muted">No sessions scheduled yet. Your tutor will set up sessions soon.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="premium-card rounded-2xl p-5 border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-section rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <CalendarIcon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">{session.course_name}</h4>
                        <p className="text-sm text-muted">
                          {session.tutor_name || "Tutor TBD"} • {new Date(session.start_time).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}, {new Date(session.start_time).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hidden sm:inline-block">
                        {session.status}
                      </span>
                      {session.meet_link && (
                        <a
                          href={session.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500/10 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                          title="Join Zoom Meeting"
                        >
                          <Video size={16} />
                        </a>
                      )}
                      <StudentAttendanceButton sessionId={session.id} isMarked={session.student_marked_present} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrolled Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>My Courses</h2>
            {!courses || courses.length === 0 ? (
              <div className="premium-card rounded-2xl p-12 text-center border border-border bg-card space-y-3">
                <BookOpen className="mx-auto text-muted" size={32} />
                <p className="text-sm text-muted">No courses enrolled yet. An administrator will assign you shortly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div key={course.id} className="premium-card rounded-2xl p-5 border border-border bg-card hover:border-primary/30 transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{course.title}</h4>
                        <p className="text-[11px] text-muted mt-0.5">{course.subject}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center gap-2 text-[11px] text-muted">
                      <UserIcon size={12} />
                      <span>Tutor: <strong className="text-foreground">{course.tutor_name || "Not assigned"}</strong></span>
                    </div>
                    {course.meet_link && (
                      <a
                        href={course.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[11px] text-primary font-bold hover:underline"
                      >
                        <Video size={12} /> Join Classroom
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Academic Profile Sidebar & WhatsApp Group */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Academic Profile</h2>
          <div className="premium-card rounded-2xl p-6 border border-border bg-card space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Full Name</span>
                <span className="font-bold">{profile?.full_name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Grade Level</span>
                <span className="font-bold">{profile?.grade_level || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Curriculum</span>
                <span className="font-bold">{profile?.curriculum || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Age</span>
                <span className="font-bold">{profile?.age || "N/A"} years</span>
              </div>
            </div>
          </div>

          {whatsappLink && (
            <div className="premium-card rounded-2xl p-6 border border-border bg-card space-y-3">
              <h3 className="font-bold text-sm">Student WhatsApp Group</h3>
              <p className="text-[11px] text-muted leading-relaxed">Join your fellow students in our WhatsApp group to collaborate, share learning tips, and stay updated!</p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all text-center block"
              >
                Join Student WhatsApp Group
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

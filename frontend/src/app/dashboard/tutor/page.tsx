import { cookies } from "next/headers";
import { api } from "@/lib/api";
import Link from "next/link";
import { 
  Users, 
  Clock, 
  Video,
  BookOpen,
  Calendar as CalendarIcon,
  ExternalLink
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function TutorDashboard() {
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
  if (profile.role !== "tutor") {
    redirect(profile.role ? `/dashboard/${profile.role}` : "/dashboard/onboarding");
  }

  // Fetch courses assigned to this tutor
  let courses: any[] = [];
  try {
    courses = await client.get("/courses/");
  } catch (error) {
    console.error("Error fetching courses:", error);
  }

  // Fetch upcoming sessions for this tutor
  let sessions: any[] = [];
  try {
    sessions = await client.get("/sessions/", {
      params: { status: 'scheduled' }
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
  }

  const courseCount = courses?.length || 0;
  const sessionCount = sessions?.length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
            Hello, {profile?.full_name?.split(' ')[0] || "Tutor"}! 👋
          </h1>
          <p className="text-muted mt-1">
            {courseCount > 0
              ? `You have ${courseCount} assigned course${courseCount > 1 ? 's' : ''} and ${sessionCount} upcoming session${sessionCount !== 1 ? 's' : ''}.`
              : "You haven't been assigned any students yet. The admin will set things up shortly."}
          </p>
        </div>
        {sessions && sessions.length > 0 && sessions[0].meet_link && (
          <a
            href={sessions[0].meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 w-fit"
          >
            <Video size={18} />
            Join Next Session
          </a>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card rounded-2xl p-6 border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-section rounded-xl"><Users className="text-blue-500" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Assigned</span>
          </div>
          <p className="text-muted text-sm">Active Students</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Total</span>
          </div>
          <p className="text-muted text-sm">Courses Assigned</p>
          <h3 className="text-3xl font-bold mt-1">{courseCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Sessions + Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sessions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Upcoming Sessions</h2>
            {!sessions || sessions.length === 0 ? (
              <div className="premium-card rounded-2xl p-12 text-center border border-border bg-card space-y-3">
                <CalendarIcon className="mx-auto text-muted" size={32} />
                <p className="text-sm text-muted">No sessions scheduled. Admin will create sessions for your courses.</p>
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
                        <h4 className="font-bold">{session.title}</h4>
                        <p className="text-sm text-muted">
                          {new Date(session.start_time).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}, {new Date(session.start_time).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })} • {session.duration}min
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
                          title="Join Google Meet"
                        >
                          <Video size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Courses */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>My Courses</h2>
            {!courses || courses.length === 0 ? (
              <div className="premium-card rounded-2xl p-12 text-center border border-border bg-card space-y-3">
                <BookOpen className="mx-auto text-muted" size={32} />
                <p className="text-sm text-muted">No courses assigned yet. New assignments will appear here.</p>
              </div>
            ) : (
              <div className="premium-card rounded-2xl p-0 overflow-hidden border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-section/50 border-b border-border">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Student</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Subject</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Status</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted">Meet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-section/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                {(course.student_name || "?").charAt(0)}
                              </div>
                              <span className="text-sm font-bold">{course.student_name || "Unassigned"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">{course.subject}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                              {course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {course.meet_link ? (
                              <a href={course.meet_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-bold flex items-center gap-1">
                                <ExternalLink size={12} /> Link
                              </a>
                            ) : (
                              <span className="text-[11px] text-muted">Not set</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: WhatsApp + Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Tutor Info</h2>
          <div className="premium-card rounded-2xl p-6 border border-border bg-card space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Name</span>
                <span className="font-bold">{profile?.full_name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Email</span>
                <span className="font-bold text-xs truncate max-w-[160px]">{profile?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted">Students</span>
                <span className="font-bold">{courseCount}</span>
              </div>
            </div>
          </div>

          <div className="premium-card rounded-2xl p-6 border border-border bg-card space-y-3">
            <h3 className="font-bold text-sm">WhatsApp Community</h3>
            <p className="text-[11px] text-muted leading-relaxed">Join our tutor community for updates, training resources, and direct admin communication.</p>
            <a
              href="https://chat.whatsapp.com/YOUR_GROUP_LINK"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all text-center block"
            >
              Join WhatsApp Group
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

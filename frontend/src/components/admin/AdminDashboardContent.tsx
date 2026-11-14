"use client";

import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  Activity,
  Calendar,
  Video,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import ApplicationDetailManager from "@/components/admin/ApplicationDetailManager";
import StudentDataManager from "@/components/admin/StudentDataManager";
import TutorDataManager from "@/components/admin/TutorDataManager";
import CourseDataManager from "@/components/admin/CourseDataManager";
import CourseScheduleManager from "@/components/admin/CourseScheduleManager";
import AttendanceDataManager from "@/components/admin/AttendanceDataManager";
import ContactMessageManager from "@/components/admin/ContactMessageManager";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import CreateCourseForm from "@/components/admin/CreateCourseForm";
import GenerateInviteForm from "@/components/admin/GenerateInviteForm";
import AssignmentDataManager from "@/components/admin/AssignmentDataManager";
import { MoreVertical } from "lucide-react";
import { deleteInviteCode } from "@/app/actions/admin";

interface AdminDashboardContentProps {
  initialTab: string;
  initialQuery: string;
}

export default function AdminDashboardContent({
  initialTab,
  initialQuery,
}: AdminDashboardContentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partialError, setPartialError] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    students: [],
    tutors: [],
    courses: [],
    sessions: [],
    assignments: [],
    tutorApps: [],
    studentApps: [],
    inviteCodes: [],
    contactMessages: [],
    settings: null,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setPartialError(null);

    // Track failures per fetch so the dashboard can tell the admin that
    // data is missing, instead of silently rendering empty tables.
    let failures = 0;
    const safe = (p: Promise<any>): Promise<any> =>
      p.catch(() => {
        failures++;
        return null;
      });

    const [
      allProfiles,
      fetchedTutorApps,
      fetchedStudentApps,
      fetchedInvites,
      fetchedMessages,
      fetchedCourses,
      fetchedSessions,
      fetchedSettings,
      fetchedAssignments,
    ] = await Promise.all([
      // All fetches go through the same-origin /api proxy (cookie auth) —
      // the access token never needs to be exposed to client JavaScript.
      safe(api.get("/profiles/", { baseUrl: "/api" })),
      safe(api.get("/tutor-applications/", { baseUrl: "/api" })),
      safe(api.get("/student-applications/", { baseUrl: "/api" })),
      safe(api.get("/invites/", { baseUrl: "/api" })),
      safe(api.get("/contact-messages/", { baseUrl: "/api" })),
      safe(api.get("/courses/", { baseUrl: "/api" })),
      safe(api.get("/sessions/", { baseUrl: "/api" })),
      safe(api.get("/settings/", { baseUrl: "/api" })),
      safe(api.get("/assignments/", { baseUrl: "/api" })),
    ]);

    if (failures === 9) {
      setError("Unable to reach the API. Check your connection and try again.");
      setLoading(false);
      return;
    }
    if (failures > 0) {
      setPartialError(
        `${failures} of 9 data sections failed to load — some lists may be incomplete. Retry to reload everything.`,
      );
    }

    setData({
      students: (allProfiles ?? []).filter((p: any) => p.role === "student"),
      tutors: (allProfiles ?? []).filter((p: any) => p.role === "tutor"),
      tutorApps: fetchedTutorApps ?? [],
      studentApps: fetchedStudentApps ?? [],
      inviteCodes: fetchedInvites ?? [],
      contactMessages: fetchedMessages ?? [],
      courses: fetchedCourses ?? [],
      // /sessions/ is paginated ({count, next, previous, results}) — unwrap.
      sessions: (fetchedSessions?.results ?? fetchedSessions) ?? [],
      settings: fetchedSettings,
      assignments: fetchedAssignments ?? [],
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tab = initialTab;
  const q = initialQuery;

  // Filter data based on query
  let filteredStudents = data.students;
  let filteredTutors = data.tutors;
  let filteredCourses = data.courses;

  if (q) {
    const query = q.toLowerCase();
    filteredStudents = data.students.filter(
      (s: any) =>
        s.full_name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query),
    );
    filteredTutors = data.tutors.filter(
      (t: any) =>
        t.full_name?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query),
    );
    filteredCourses = data.courses.filter(
      (c: any) =>
        c.title?.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query),
    );
  }

  const pendingTutorApps = data.tutorApps.filter(
    (a: any) => a.status === "pending",
  ).length;
  const pendingStudentApps = data.studentApps.filter(
    (a: any) => a.status === "pending",
  ).length;
  const totalPendingApps = pendingTutorApps + pendingStudentApps;

  const tabs = [
    { key: "applications", label: "Applications", count: totalPendingApps },
    { key: "students", label: "Students", count: data.students.length },
    { key: "tutors", label: "Tutors", count: data.tutors.length },
    { key: "invites", label: "Registration Codes" },
    {
      key: "inquiries",
      label: "Inquiries",
      count: data.contactMessages.length,
    },
    { key: "courses", label: "Courses", count: data.courses.length },
    { key: "assignments", label: "Assignments", count: data.assignments.length },
    { key: "sessions", label: "Sessions" },
    { key: "attendance", label: "Attendance" },
    { key: "settings", label: "Settings" },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4 animate-pulse">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-muted text-sm font-medium">
          Synchronizing with control center...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 text-center">
        <div className="bg-red-50 p-4 rounded-full text-red-500">
          <Activity size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">Unable to load dashboard data</h3>
          <p className="text-muted text-sm max-w-sm">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Partial-failure banner — incomplete data is visible, never silent */}
      {partialError && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl">
          <span className="flex items-center gap-2">
            <Activity size={16} /> {partialError}
          </span>
          <button
            onClick={fetchData}
            className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900 rounded-lg shrink-0"
            title="Retry all fetches"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data.students.length}
          icon={<Users size={20} />}
          color="text-blue-600"
        />
        <StatCard
          title="Active Tutors"
          value={data.tutors.length}
          icon={<GraduationCap size={20} />}
          color="text-purple-600"
        />
        <StatCard
          title="Applications"
          value={totalPendingApps}
          icon={<Activity size={20} />}
          color="text-amber-600"
        />
        <StatCard
          title="Live Courses"
          value={data.courses.length}
          icon={<BookOpen size={20} />}
          color="text-green-600"
        />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`?tab=${t.key}${q ? `&q=${q}` : ""}`}
              className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-all relative ${tab === t.key ? "text-primary" : "text-muted hover:text-foreground"}`}
            >
              {t.label}
              {t.count != null && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-primary/10 rounded-md">
                  {t.count}
                </span>
              )}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
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
                <h2
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  Active Registration Codes
                </h2>
              </div>
              {data.inviteCodes.length === 0 ? (
                <div className="p-12 text-center text-muted text-sm">
                  No active codes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-section-alt/50 border-b border-border">
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                          Code
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                          Role
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                          Target Email
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                          Status
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.inviteCodes.map((code: any) => (
                        <tr
                          key={code.id}
                          className="hover:bg-section/5 transition-colors"
                        >
                          <td className="px-5 py-4 font-mono font-bold text-sm text-primary">
                            {code.code}
                          </td>
                          <td className="px-5 py-4 text-xs capitalize">
                            {code.role}
                          </td>
                          <td className="px-5 py-4 text-xs text-muted">
                            {code.target_email || "Any"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${code.is_used ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                            >
                              {code.is_used ? "Used" : "Available"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <form
                                action={async () => {
                                  await deleteInviteCode(code.id);
                                  fetchData();
                                }}
                              >
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
              sessions={data.sessions}
            />
          </div>
        )}

        {/* ========== ASSIGNMENTS TAB ========== */}
        {tab === "assignments" && (
          <AssignmentDataManager
            assignments={data.assignments}
            students={data.students}
            tutors={data.tutors}
          />
        )}

        {/* ========== SESSIONS TAB ========== */}
        {tab === "sessions" && (
          <CourseScheduleManager courses={data.courses} />
        )}

        {/* ========== ATTENDANCE TAB ========== */}
        {tab === "attendance" && (
          <AttendanceDataManager
            sessions={data.sessions}
            students={data.students}
            tutors={data.tutors}
          />
        )}

        {/* ========== INQUIRIES TAB ========== */}
        {tab === "inquiries" && (
          <ContactMessageManager messages={data.contactMessages} />
        )}

        {/* ========== SETTINGS TAB ========== */}
        {tab === "settings" && <AdminSettingsPanel settings={data.settings} />}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="premium-card rounded-2xl p-5 group hover:border-primary/30 transition-all shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div
          className={`p-2.5 rounded-xl bg-section-alt group-hover:bg-primary/5 transition-colors ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Search, X, Calendar, Clock, Edit, Loader2 } from "lucide-react";
import { updateCourseSchedules } from "@/app/actions/admin";

export default function CourseScheduleManager({
  courses: initialCourses,
}: {
  courses: any[];
}) {
  const [courses, setCourses] = useState<any[]>(initialCourses || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Keep in sync if parent refreshes
  useEffect(() => {
    setCourses(initialCourses || []);
  }, [initialCourses]);

  const filteredCourses = courses.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tutor_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUpdateSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    // Optimistically build the new schedules for instant UI update
    const newSchedules: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const day = formData.get(`day${i}`) as string;
      const time = formData.get(`time${i}`) as string;
      if (day && time) {
        newSchedules.push({
          day_of_week: day,
          start_time: `${time}:00`,
          duration_minutes: 60,
        });
      }
    }

    // Instant optimistic update
    setCourses((prev) =>
      prev.map((c) =>
        c.id === editingCourse.id ? { ...c, schedules: newSchedules } : c,
      ),
    );
    setEditingCourse(null);

    try {
      // Build payload in the expected shape: { day, time }[]
      const payloadSchedules: { day: string; time: string }[] = [];
      for (let i = 1; i <= 3; i++) {
        const day = formData.get(`day${i}`) as string;
        const time = formData.get(`time${i}`) as string;
        if (day && time) payloadSchedules.push({ day, time: `${time}:00` });
      }

      const res = await updateCourseSchedules(
        editingCourse.id,
        payloadSchedules,
      );
      if (res.error) {
        // Revert optimistic update on error
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? { ...c, schedules: editingCourse.schedules }
              : c,
          ),
        );
        alert(`Error: ${res.error}`);
        return;
      }

      // Use actual saved schedules from API response to confirm what's in DB
      if (res.data?.schedules) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === editingCourse.id
              ? { ...c, schedules: res.data.schedules }
              : c,
          ),
        );
      }
    } finally {
      setSaving(false);
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
            placeholder="Search by course or tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="text-xs font-bold text-muted uppercase tracking-widest">
          {filteredCourses.length} Courses
        </div>
      </div>

      {/* Course Schedules Table */}
      <div className="premium-card rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-section-alt/50 border-b border-border">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                  Course Info
                </th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                  Weekly Schedule (Max 3)
                </th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-muted text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.map((c) => (
                <tr key={c.id} className="hover:bg-section/5 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">{c.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-section-alt rounded text-muted font-medium leading-none">
                        {c.category}
                      </span>
                      {c.tutor_name && (
                        <span className="text-[10px] text-muted-foreground italic">
                          with {c.tutor_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {c.schedules && c.schedules.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {c.schedules.map((s: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2 py-1 rounded-md text-[10px] font-bold text-primary"
                          >
                            <Calendar size={10} />
                            <span className="capitalize">{s.day_of_week}</span>
                            <Clock size={10} className="ml-1 opacity-60" />
                            {typeof s.start_time === "string"
                              ? s.start_time.slice(0, 5)
                              : s.start_time}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted italic">
                        No schedule set.
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setEditingCourse(c)}
                      className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all"
                      title="Edit Timetable"
                    >
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCourses.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="p-12 text-center text-muted text-sm italic"
                  >
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border bg-section-alt/50">
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  Edit Timetable
                </h3>
                <p className="text-sm text-muted">{editingCourse.title}</p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUpdateSchedule}
              className="p-6 overflow-y-auto space-y-6"
            >
              <div className="space-y-3">
                <h4 className="text-sm font-bold">
                  Weekly Schedule (3 sessions per week)
                </h4>
                <p className="text-xs text-muted">
                  Set the fixed timetable. Session dates will be generated
                  automatically based on these rules.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {[1, 2, 3].map((num) => {
                    const sched = editingCourse.schedules?.[num - 1] || {};
                    const dayDefault = sched.day_of_week || "";
                    const rawTime = sched.start_time || "";
                    const timeDefault =
                      rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime;
                    return (
                      <div
                        key={num}
                        className="p-3 bg-section-alt rounded-xl border border-border space-y-2"
                      >
                        <p className="text-[10px] font-bold text-muted uppercase">
                          Session {num}
                        </p>
                        <select
                          name={`day${num}`}
                          defaultValue={dayDefault}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Select Day</option>
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                        <input
                          type="time"
                          name={`time${num}`}
                          defaultValue={timeDefault}
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-section-alt transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Saving..." : "Save Timetable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { COURSE_CATEGORIES } from "@/lib/courses";
import { api } from "@/lib/api";

export const metadata = {
  title: "Our Courses | Impact Tutors",
  description:
    "Explore 1-on-1 tutoring programs: K-12 & adult classes, Nigerian languages, coding for kids, music, and global exam preparation.",
};

export default async function CoursesPage() {
  // Live programs are real, published courses from the backend (public,
  // read-only endpoint). Any failure hides the section gracefully.
  const livePrograms: any[] = await api
    .get<any[]>("/courses/published/")
    .catch(() => []);

  return (
    <div className="pt-28 pb-20 px-4 md:px-6">
      <div className="container mx-auto ">
        {/* Header */}
        <div className="max-w-3xl mb-14 space-y-4 animate-fade-in-up mx-auto ">
          <p className="text-sm font-bold text-center text-primary uppercase tracking-[0.2em]">Explore Programs</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-center">
            Our Most <span className="text-primary italic">Popular</span> Courses
          </h1>
          <p className="text-lg text-muted leading-relaxed text-center" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Let's join our famous class. The knowledge provided will definitely be useful for you.
          </p>
        </div>

        {/* Live Programs — published courses from the platform */}
        {livePrograms.length > 0 && (
          <div className="mb-16 space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h2 className="text-xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
                Live Programs Open for Enrollment
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {livePrograms.map((course) => (
                <div
                  key={course.id}
                  className="premium-card bg-card p-7 flex flex-col h-full border border-border"
                >
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg w-fit mb-4">
                    {course.category}
                  </span>
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "'Lora', serif" }}>
                    {course.seo_title || course.title}
                  </h3>
                  <p className="text-muted leading-relaxed text-sm flex-1 mb-4 line-clamp-3">
                    {course.seo_description || course.description}
                  </p>
                  {course.tutor_name && (
                    <p className="text-[11px] text-muted mb-4">
                      Tutor: <strong className="text-foreground">{course.tutor_name}</strong>
                    </p>
                  )}
                  <Link
                    href="/student/apply"
                    className="flex items-center gap-2 font-bold text-sm text-primary hover:gap-3 transition-all"
                  >
                    Apply Now <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSE_CATEGORIES.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="premium-card bg-card p-7 group relative overflow-hidden flex flex-col h-full"
            >
              <div className={`w-14 h-14 ${course.color} text-white rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                {course.icon}
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Lora', serif" }}>{course.title}</h3>
              <p className="text-muted leading-relaxed mb-6 flex-1 text-sm">{course.tagline}</p>
              <div className="flex items-center gap-2 font-bold text-sm text-primary group-hover:gap-3 transition-all duration-300">
                Learn More <ChevronRight size={16} />
              </div>

              <div className={`absolute top-0 right-0 w-24 h-24 ${course.color} opacity-[0.04] rounded-bl-full -mr-8 -mt-8`} />
            </Link>
          ))}
        </div>

        {/* Custom Request */}
        <div className="mt-20 relative overflow-hidden rounded-2xl bg-primary p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 text-white">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />
          <div className="relative z-10 space-y-3 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold">Don't see what you're looking for?</h2>
            <p className="text-white/80 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>We offer custom tutoring packages for many more subjects. Tell us your needs.</p>
          </div>
          <Link
            href="/contact"
            className="relative z-10 px-8 py-4 bg-white text-primary rounded-xl font-bold hover:shadow-xl transition-all duration-300 whitespace-nowrap"
          >
            Custom Request
          </Link>
        </div>
      </div>
    </div>
  );
}

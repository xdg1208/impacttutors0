import { CheckCircle2, ChevronRight, Clock, Shield, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCourseBySlug } from "@/lib/courses";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  return {
    title: course ? `${course.title} | Impact Tutors` : "Course Not Found | Impact Tutors",
    description: course?.tagline ?? "Explore our 1-on-1 tutoring programs.",
  };
}

export default async function CourseDetail({ params }: PageProps) {
  // Next 15+/16: params is a Promise and MUST be awaited before use.
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Legacy aliases redirect to the canonical URL (keeps indexed URLs
  // working without duplicating content).
  if (course.slug !== slug) {
    redirect(`/courses/${course.slug}`);
  }

  return (
    <div className="pt-32 pb-20 px-6 font-sans">
      <div className="container mx-auto">
        <Link href="/courses" className="inline-flex items-center gap-2 text-muted hover:text-primary font-bold mb-12 group transition-colors">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Courses
        </Link>

        <div className="grid lg:grid-cols-3 gap-16 items-start">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                {course.title}
              </h1>
              <p className="text-xl text-muted leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-bold">What you'll learn</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {course.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 p-4 glass rounded-2xl border-border">
                    <CheckCircle2 className="text-primary flex-shrink-0" size={24} />
                    <span className="font-semibold">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-bold">Course Curriculum</h2>
              <div className="space-y-4">
                {course.curriculum.map((item, index) => (
                  <div key={item} className="flex items-start gap-6 group">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{item}</h4>
                      <p className="text-sm text-muted">Deep dive into the core concepts and practical applications.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 space-y-8">
            <div className="glass p-8 rounded-[3rem] border-primary/20 shadow-2xl relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-primary">Mentorship Plan</p>
                  <p className="text-4xl font-black">1-on-1 Classes</p>
                </div>

                <div className="space-y-4 pt-4">
                  <BenefitItem icon={<Clock size={20} />} text="Flexible Schedule" />
                  <BenefitItem icon={<Shield size={20} />} text="Verified Expert Tutors" />
                  <BenefitItem icon={<Award size={20} />} text="Certificate of Completion" />
                </div>

                <Link
                  href="/student/apply"
                  className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                >
                  Apply Now
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-center text-xs text-muted font-medium">No hidden fees. Payments are discussed after tutor assignment.</p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-[0.05] rounded-bl-full -mr-16 -mt-16" />
            </div>

            <div className="p-8 glass bg-slate-900 text-white rounded-[3rem] space-y-4">
              <h4 className="text-xl font-bold">Have Questions?</h4>
              <p className="text-slate-400 text-sm">Our academic advisors are ready to help you choose the right path.</p>
              <Link href="/contact" className="text-primary font-bold inline-flex items-center gap-2 hover:gap-3 transition-all">
                Contact Advisors <ChevronRight size={18} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
      <div className="text-primary">{icon}</div>
      <span>{text}</span>
    </div>
  );
}

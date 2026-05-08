import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export default async function AboutPage() {
  const cookieStore = await cookies();
  const hasToken = cookieStore.get("access_token")?.value;
  const user = hasToken ? { id: "authenticated" } : null;
  return (
    <div className="pt-28 pb-20 px-4 md:px-6 ">
      <div className="container mx-auto max-w-[95%]">
        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-20 ">
          <div className="space-y-6 animate-fade-in-up">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">About Us</p>
            <h1 className="text-4xl lg:text-4xl font-bold tracking-tight leading-tight">
              Impact Tutors <span className="text-primary italic">Providing</span> The Best Opportunities To Students
            </h1>
            <p className="text-lg text-muted leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Founded with a mission to bridge the gap in personalized education, Impact Tutors connects learners worldwide with expert educators who inspire excellence.
            </p>
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold transition-all duration-300 hover:shadow-xl hover:shadow-primary/25"
            >
              {user ? "Go to Dashboard" : "Join Us →"}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 animate-slide-in-right">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg">
              <Image src="/images/hero1.png" alt="Student learning" fill className="object-cover" />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg mt-8">
              <Image src="/images/hero0.png" alt="Student achieving" fill className="object-cover" />
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="premium-card rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Our Vision</h2>
            <p className="text-muted leading-relaxed">
              To be the leading platform for 1-on-1 personalized learning, empowering the next generation of global leaders, thinkers, and innovators.
            </p>
          </div>
          <div className="premium-card rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Our Mission</h2>
            <p className="text-muted leading-relaxed">
              To deliver high-quality, accessible, and personalized tutoring that caters to every student&apos;s unique learning style and pace.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-section-alt -mx-4 md:-mx-6 px-4 md:px-6 py-16 md:py-20 relative">
          <div className="absolute inset-0 dot-pattern -z-10" />
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-3">Features</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why Choose Us?</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "1-on-1 Dedicated Attention",
                "Expert K-12 & Adult Educators",
                "Specialized Music & Tech Classes",
                "Yoruba, Igbo, & Hausa Language Tutors",
                "Flexible Global Scheduling",
                "Strategic Exam Preparation",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 premium-card rounded-2xl bg-card">
                  <CheckCircle2 className="text-primary flex-shrink-0" size={22} />
                  <span className="font-semibold text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

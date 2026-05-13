import { MessageSquare, UserPlus, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export default async function HowItWorksPage() {
  const cookieStore = await cookies();
  const hasToken = cookieStore.get("access_token")?.value;
  const user = hasToken ? { id: "authenticated" } : null;
  return (
    <div className="pt-28 pb-20 px-4 md:px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-fade-in-up">
          <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Process</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            How It <span className="text-primary italic">Works</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Starting your journey to academic excellence is simple. Here&apos;s a quick look at how we help you succeed.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-[2px] bg-border -z-10" />
          
          <StepCard 
            number="01"
            title="Sign Up"
            description="Create your account and tell us about your learning goals and level."
            icon={<UserPlus size={28} />}
          />
          <StepCard 
            number="02"
            title="Get Assigned"
            description="Our team matches you with the best-fit tutor for your specific subject."
            icon={<MessageSquare size={28} />}
          />
          <StepCard 
            number="03"
            title="Start Learning"
            description="Join your personalized 1-on-1 session via Zoom at your scheduled time."
            icon={<BookOpen size={28} />}
          />
          <StepCard 
            number="04"
            title="Excel"
            description="Track your progress and achieve the grades you've always dreamed of."
            icon={<Trophy size={28} />}
          />
        </div>

        {/* CTA */}
        <div className="mt-20 relative overflow-hidden rounded-2xl bg-primary p-10 md:p-14 text-center text-white">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />
          <div className="relative z-10 space-y-5 max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold">Ready to take the first step?</h2>
            <p className="text-white/80 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Our admin team is standing by to match you with your perfect tutor. No marketplace stress, just personalized learning.
            </p>
            <Link
              href={user ? "/dashboard" : "/student/apply"}
              className="inline-block px-8 py-4 bg-white text-primary rounded-xl font-bold hover:shadow-xl transition-all duration-300"
            >
              {user ? "Go to Your Dashboard" : "Get Started Today"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <div className="premium-card rounded-2xl bg-card p-7 relative group h-full">
      <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-primary/25">
        {number}
      </div>
      <div className="w-14 h-14 bg-primary/8 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Lora', serif" }}>{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

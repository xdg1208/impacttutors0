import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star, Users, BookOpen, ShieldCheck, Globe, GraduationCap, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export default async function Home() {
  const cookieStore = await cookies();
  const hasToken = cookieStore.get("access_token")?.value;
  
  // Quick user check for the "Get Started" vs "Dashboard" button
  const user = hasToken ? { id: "authenticated" } : null;
  return (
    <div className="relative overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 px-4 md:px-6 ">
        {/* Dot pattern background */}
        <div className="absolute inset-0 dot-pattern -z-10" />
        
        {/* Decorative circles */}
        <div className="absolute top-20 right-[10%] w-72 h-72 circle-decoration hidden lg:block" />
        <div className="absolute bottom-10 right-[20%] w-16 h-16 bg-primary rounded-full opacity-10 hidden lg:block" />
        <div className="absolute top-40 left-[5%] w-8 h-8 bg-accent rounded-full opacity-15 hidden lg:block animate-float" />
        <div className="absolute bottom-32 left-[8%] w-20 h-20 ring-decoration hidden lg:block" />

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-[95%] ">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-in-up ">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light text-primary rounded-full text-sm font-bold border border-primary/15">
              <Globe className="w-4 h-4" />
              <span>World-Class 1-on-1 Online Tutoring</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-4xl font-bold tracking-tight leading-[1.12]">
              Excellence isn't a <span className="text-primary italic">destination</span>, it's the   <span className="text-primary italic">Journey</span> we take with every Student
            </h1>
            
            <p className="text-lg text-muted leading-relaxed max-w-xl" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Every student deserves a learning experience as unique as they are. From K-12 to Adult classes, Coding, and Music, we empower learners across the globe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl text-base font-bold hover:bg-primary/90 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 flex items-center justify-center gap-2 group"
              >
                {user ? "View Dashboard" : "Get Started"}
                <ChevronRight className="group-hover:translate-x-0.5 transition-transform duration-300" size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-card border border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2"
              >
                How it Works
              </Link>
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted font-medium">
                <Sparkles size={16} className="text-primary" />
                Special Career Guide
              </div>
              <div className="flex items-center gap-2 text-sm text-muted font-medium">
                <ShieldCheck size={16} className="text-primary" />
                Supervised Monitoring
              </div>
              <div className="flex items-center gap-2 text-sm text-muted font-medium">
                <BookOpen size={16} className="text-primary" />
                Assessment & Evaluation
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative animate-slide-in-right flex items-center justify-center ">
            <div className="relative w-[80%] aspect-[4/5] md:aspect-square rounded-full overflow-hidden shadow-2xl shadow-primary/10  ">
              <Image
                src="/images/hero1.png"
                alt="Student learning with Impact Tutors"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Floating stat: top-right */}
            <div className="absolute -top-4 -right-4 md:top-4 md:-right-6 stat-card bg-white dark:bg-slate-900 p-4 animate-float z-10 border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <BookOpen size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Online Courses</p>
                  <p className="text-xl font-extrabold text-foreground">5K+</p>
                </div>
              </div>
            </div>

            {/* Floating stat: center-left */}
            <div className="absolute top-1/3 -left-4 md:-left-8 stat-card bg-white dark:bg-slate-900 p-4 animate-float delay-300 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Students</p>
                  <p className="text-xl font-extrabold text-foreground">2K+</p>
                </div>
              </div>
            </div>

            {/* Floating stat: bottom-right */}
            <div className="absolute bottom-8 -right-4 md:-right-6 stat-card bg-white dark:bg-slate-900 p-4 animate-float delay-500 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">Tutors</p>
                  <p className="text-xl font-extrabold text-foreground">250+</p>
                </div>
              </div>
            </div>

            {/* Green accent dot */}
            <div className="absolute bottom-1/4 -left-2 w-5 h-5 bg-primary rounded-full opacity-70 animate-float delay-700 hidden md:block" />
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-10 border-y border-border bg-section-alt">
        <div className="container mx-auto px-4 md:px-6">
          <p className="text-center text-xs font-bold text-muted uppercase tracking-[0.2em] mb-6">Trusted by parents and students nationwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-50 hover:opacity-80 transition-opacity duration-500">
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>UK</span>
            <span className="text-xl font-bold tracking-tight text-primary" style={{ fontFamily: "'Lora', serif" }}>USA</span>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>CANADA</span>
            <span className="text-xl font-bold tracking-tight text-accent" style={{ fontFamily: "'Lora', serif" }}>AUSTRALIA</span>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>GERMANY</span>
            <span className="text-xl font-bold tracking-tight text-primary" style={{ fontFamily: "'Lora', serif" }}>MALAYSIA</span>
          </div>
        </div>
      </section>

      {/* ── Our Services ── */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Our Services</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Fostering a playful & engaging<br className="hidden md:block" /> learning environment
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CategoryCard 
              title="K-12 & Adult Classes" 
              description="From primary fundamentals to advanced professional development, we cover every stage of learning."
              icon={<GraduationCap size={24} />}
              color="bg-primary"
              href="/courses/k12-adult"
            />
            <CategoryCard 
              title="Coding & Tech" 
              description="Learn Python, Web Development, and Digital Literacy. Master the skills that define the future."
              icon={<BookOpen size={24} />}
              color="bg-accent"
              href="/courses/coding"
            />
            <CategoryCard 
              title="Music & Languages" 
              description="Explore Music classes or learn Yoruba, Igbo, and Hausa with native-speaking experts."
              icon={<ShieldCheck size={24} />}
              color="bg-slate-800 dark:bg-slate-600"
              href="/courses/music-languages"
            />
          </div>

          <div className="text-center mt-12">
            <Link href="/courses" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-border hover:border-primary/40 rounded-xl font-bold transition-all duration-300 hover:bg-primary/5 group">
              Explore All Programs
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-section-alt relative">
        <div className="absolute inset-0 dot-pattern -z-10" />
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Our Plans</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Flexible Learning Packages</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Gold Package */}
            <div className="premium-card rounded-2xl bg-card p-10 flex flex-col border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-primary/20">
                  Most Popular
                </div>
                <h3 className="text-3xl font-bold mb-2 text-foreground" style={{ fontFamily: "'Lora', serif" }}>Gold Package</h3>
                <p className="text-sm text-muted mb-8">Perfect for core academic excellence</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-primary">$25</span>
                  <span className="text-muted font-medium">/ class</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Star size={12} fill="currentColor" /></div>
                    Mathematics
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Star size={12} fill="currentColor" /></div>
                    English Language
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Star size={12} fill="currentColor" /></div>
                    Science Subjects
                  </li>
                </ul>
                <Link href={user ? "/dashboard" : "/signup"} className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/25 transition-all">
                  {user ? "Go to Dashboard" : "Get Gold Plan"} <ChevronRight size={18} />
                </Link>
              </div>
            </div>

            {/* Ruby Package */}
            <div className="premium-card rounded-2xl bg-card p-10 flex flex-col border-2 border-accent/20 hover:border-accent/40 transition-all duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-accent/10 transition-colors" />
              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-accent/20">
                  Premium
                </div>
                <h3 className="text-3xl font-bold mb-2 text-foreground" style={{ fontFamily: "'Lora', serif" }}>Ruby Package</h3>
                <p className="text-sm text-muted mb-8">Comprehensive skill & group learning</p>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-accent">$50</span>
                  <span className="text-muted font-medium">/ month</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center text-accent"><Star size={12} fill="currentColor" /></div>
                    Coding & Tech Literacy
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center text-accent"><Star size={12} fill="currentColor" /></div>
                    Adult Education Classes
                  </li>
                  <li className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center text-accent"><Star size={12} fill="currentColor" /></div>
                    Language & Group Classes
                  </li>
                </ul>
                <Link href={user ? "/dashboard" : "/signup"} className="w-full py-4 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-accent/25 transition-all">
                  {user ? "Go to Dashboard" : "Get Ruby Plan"} <ChevronRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-20 md:py-28 px-4 md:px-6 relative">
        <div className="absolute inset-0 dot-pattern -z-10" />
        
        <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Image Side */}
          <div className="relative animate-fade-in-up">
            <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-xl">
              <Image
                src="/images/hero0.png"
                alt="Student achieving academic excellence"
                fill
                className="object-cover"
              />
            </div>

            {/* Accent circle */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full -z-10" />
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-accent/10 rounded-full -z-10" />
          </div>

          {/* Content Side */}
          <div className="space-y-8">
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-3">Why Choose Us</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                We are always working to provide you the best learning experience
              </h2>
            </div>

            <p className="text-muted leading-relaxed text-lg" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Impact Tutors connects learners of all ages with vetted, world-class educators. Our platform is built on trust, quality, and measurable outcomes for every student, regardless of their location.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "1-on-1 Dedicated Attention",
                "World-Class Expert Tutors",
                "Flexible Global Scheduling",
                "Personalized Study Plans",
                "Languages & Cultural Learning",
                "Music & Tech Specialized Classes",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-200">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <span className="text-sm font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <Link
              href={user ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 group"
            >
              {user ? "Your Dashboard" : "Join Us"}
              <ChevronRight className="group-hover:translate-x-0.5 transition-transform duration-300" size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-section-alt relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern -z-10" />
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="How do the lessons work?" 
              answer="Lessons are conducted live via 1-on-1 or small group sessions on Google Meet, Zoom, or Microsoft Teams. We prioritize an engaging experience." 
            />
            <FAQItem 
              question="What subjects and grade levels do you cover?" 
              answer="We cover learners from Kindergarten to High School (K-12) and Adult classes. Subjects include Mathematics, English, Science, Coding, Music, and diverse Languages." 
            />
            <FAQItem 
              question="Which curricula do you follow?" 
              answer="We provide preparation for diverse international standards, including British and American curricula. We also support students preparing for IGCSE, Checkpoint, and SATs." 
            />
            <FAQItem 
              question="How are students matched with tutors?" 
              answer="Impact Tutors pairs each student with a vetted, expert educator based on their specific goals, academic level, and age group." 
            />
            <FAQItem 
              question="Do you provide homework and progress reports?" 
              answer="Yes. Tutors assign homework after each class, and parents receive a detailed performance report every month or quarter." 
            />
            <FAQItem 
              question="How much do the lessons cost?" 
              answer="Our academic classes are priced competitively, starting from $15 to $25 per session depending on the subject, tutor expertise, and package size." 
            />
            <FAQItem 
              question="What equipment do I need for online classes?" 
              answer="A phone, tablet, or laptop with a stable internet connection and earphones is all you need. We provide all necessary digital learning materials." 
            />
            <FAQItem 
              question="Are the online lessons safe for children?" 
              answer="Absolutely. All our tutors undergo strict background checks, every session is recorded for quality assurance, and we adhere to a comprehensive child-safeguarding policy." 
            />
            <FAQItem 
              question="What is your refund and payment policy?" 
              answer="Payments are made at the start of every month. While we don't typically offer refunds, we allow flexible rescheduling to ensure your child receives every class they've paid for." 
            />
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary p-12 md:p-16 lg:p-20 text-center text-white">
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }} />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Ready to Transform Your Grades?
              </h2>
              <p className="text-lg text-white/80 leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Join 2,000+ students already excelling with personalized 1-on-1 tutoring. Start your journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href={user ? "/dashboard" : "/signup"}
                  className="px-8 py-4 bg-white text-primary rounded-xl text-base font-bold transition-all duration-300 hover:shadow-xl group flex items-center justify-center gap-2"
                >
                  {user ? "Go to My Dashboard" : "Start Learning Now"}
                  <ChevronRight className="group-hover:translate-x-0.5 transition-transform duration-300" size={18} />
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 border-2 border-white/30 text-white rounded-xl text-base font-bold transition-all duration-300 hover:bg-white/10 flex items-center justify-center"
                >
                  Talk to Us
                </Link>
                <Link
                  href="/tutor/apply"
                  className="px-8 py-4 bg-accent text-white rounded-xl text-base font-bold transition-all duration-300 hover:shadow-xl flex items-center justify-center"
                >
                  Apply to Teach
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

function CategoryCard({ title, description, icon, color, href }: CategoryCardProps) {
  return (
    <Link href={href} className="premium-card rounded-2xl bg-card p-8 flex flex-col h-full group">
      <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Lora', serif" }}>{title}</h3>
      <p className="text-muted leading-relaxed mb-6 flex-1 text-sm">{description}</p>
      <div className="flex items-center gap-2 font-bold text-sm text-primary group-hover:gap-3 transition-all duration-300">
        Learn More <ChevronRight size={16} />
      </div>
    </Link>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="premium-card rounded-2xl bg-card group border-border hover:border-primary/20 transition-all duration-300">
      <summary className="p-6 flex items-center justify-between cursor-pointer font-bold list-none">
        <span className="pr-4">{question}</span>
        <div className="flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted group-open:bg-primary group-open:text-white group-open:border-primary transition-all duration-300">
          <ChevronRight size={14} className="group-open:rotate-90 transition-transform duration-300" />
        </div>
      </summary>
      <div className="px-6 pb-6 text-muted text-sm leading-relaxed animate-fade-in list-none">
        {answer}
      </div>
    </details>
  );
}

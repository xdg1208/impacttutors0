"use client";

import { useState } from "react";
import { Send, CheckCircle2, Globe, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { submitTutorApplication, getGlobalSettings } from "@/app/actions/applications";

export default function TutorApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("https://chat.whatsapp.com/L8p5M460Rka9E4m9A9Y0pX");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subjects: "",
    experience: "",
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fData = new FormData();
    fData.append("fullName", formData.fullName);
    fData.append("email", formData.email);
    fData.append("phone", formData.phone);
    fData.append("subjects", formData.subjects);
    fData.append("experience", formData.experience);
    fData.append("preferredContactMethod", (formData as any).preferredContactMethod || "WhatsApp");
    fData.append("contactDetail", (formData as any).contactDetail || "");

    try {
      const result = await submitTutorApplication(fData);

      if (result.error) {
        throw new Error(result.error);
      }

      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Fetch dynamic link
      const settings = await getGlobalSettings();
      if (settings?.whatsapp_group_link) {
        setWhatsappLink(settings.whatsapp_group_link);
      }
    } catch (error: any) {
       console.error("Submission error:", error);
       setError(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="pt-32 pb-20 px-4 flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full bg-card p-8 md:p-12 rounded-[2rem] border border-border shadow-2xl text-center space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Application Sent!</h1>
          <p className="text-muted leading-relaxed">
            Thank you for applying to Impact Tutors. Your details have been received.
          </p>
          <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4">
            <p className="text-sm font-bold text-primary uppercase tracking-widest text-[10px]">Next Step</p>
            <p className="text-sm font-semibold">Join our WhatsApp recruitment group for interview scheduling and more info.</p>
            <a 
              href={whatsappLink}
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Join WhatsApp Group
            </a>
          </div>
          <Link href="/" className="text-sm font-bold text-muted hover:text-primary block pt-4">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 md:px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 -ml-48 -mb-48" />

      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-start max-w-[95%] mx-auto">
          {/* Info Side */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-4">
              <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Join Our Team</p>
              <h1 className="text-4xl lg:text-[3.5rem] font-bold tracking-tight leading-tight">
                Empower the next <span className="text-primary italic">Generation</span>
              </h1>
              <p className="text-lg text-muted leading-relaxed" style={{ fontFamily: "'Nunito', sans-serif" }}>
                We are looking for passionate educators to provide world-class 1-on-1 tutoring. Join a global community of expert tutors and make a lasting impact.
              </p>
            </div>

            <div className="grid gap-6">
              <FeatureItem 
                icon={<Globe className="text-primary" />} 
                title="Global Reach" 
                description="Teach students from the UK, USA, Canada, and beyond." 
              />
              <FeatureItem 
                icon={<BookOpen className="text-accent" />} 
                title="Flexible Hours" 
                description="Coordinate classes that fit your own professional schedule." 
              />
              <FeatureItem 
                icon={<GraduationCap className="text-primary" />} 
                title="Expert Community" 
                description="Collaborate with vetted educators across diverse subjects." 
              />
            </div>
          </div>

          {/* Form Side */}
          <div className="premium-card rounded-2xl bg-card p-8 md:p-12 animate-slide-in-right relative">
            <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Lora', serif" }}>Tutor Application</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl animate-shake">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    name="phone"
                    required 
                    className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                    placeholder="+234..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Preferred Contact</label>
                  <select 
                    name="preferredContactMethod"
                    required 
                    className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm appearance-none"
                    value={(formData as any).preferredContactMethod || "WhatsApp"}
                    onChange={(e) => setFormData({...formData, preferredContactMethod: e.target.value} as any)}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Contact Detail</label>
                  <input 
                    type="text" 
                    name="contactDetail"
                    required 
                    className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                    placeholder="e.g. WhatsApp number"
                    value={(formData as any).contactDetail || ""}
                    onChange={(e) => setFormData({...formData, contactDetail: e.target.value} as any)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Subjects (Comma separated)</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" 
                  placeholder="Mathematics, Physics, Python"
                  value={formData.subjects}
                  onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Brief Experience</label>
                <textarea 
                  rows={4} 
                  required 
                  className="w-full px-5 py-3.5 bg-section border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none" 
                  placeholder="Tell us about your teaching background..."
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application
                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-border rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:border-primary/30 transition-all">
        {icon}
      </div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

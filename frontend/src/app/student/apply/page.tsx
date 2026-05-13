"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, User, Mail, Phone, GraduationCap, Book, MessageSquare, CheckCircle2 } from "lucide-react";
import { submitStudentApplication } from "@/app/actions/applications";

export default function StudentApplyPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await submitStudentApplication(formData);

    if (result.success) {
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setError(result.error || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center section-alt relative">
        <div className="absolute inset-0 dot-pattern -z-10" />
        <div className="w-full max-w-2xl premium-card p-12 text-center space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Application Submitted!</h1>
            <p className="text-muted leading-relaxed">
              Thank you for applying to Impact Tutors. Our team will review your application and contact you via email or phone within 24-48 hours to discuss the next steps and set up your student's dashboard.
            </p>
          </div>
          <div className="pt-6">
            <Link href="/" className="px-8 py-3.5 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-6 section-alt relative">
      <div className="absolute inset-0 dot-pattern -z-10" />
      
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
            Invest in Your Child's <span className="text-primary italic">Future</span>
          </h1>
          <p className="text-muted text-lg">
            Complete the form below to apply for our personalized tutoring services. We match every student with the perfect tutor based on their academic goals.
          </p>
        </div>

        <div className="grid lg:grid-cols-1 gap-0 items-stretch animate-fade-in-up">
          <div className="premium-card rounded-2xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Parent Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2" style={{ fontFamily: "'Lora', serif" }}>
                    <User className="text-primary" size={20} /> Parent Information
                  </h2>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Parent/Guardian Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input name="parentName" required placeholder="Full Name"
                        className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input name="email" type="email" required placeholder="Email for communication"
                        className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input name="phone" type="tel" required placeholder="Phone number with country code"
                        className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Preferred Contact</label>
                      <select name="preferredContactMethod" required className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm appearance-none">
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="Phone Call">Phone Call</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Contact Detail</label>
                      <input name="contactDetail" required placeholder="e.g. WhatsApp number"
                        className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                    </div>
                  </div>
                </div>

                {/* Student Information */}
                <div className="space-y-6">
                  <h2 className="text-xl font-bold border-b border-border pb-2 flex items-center gap-2" style={{ fontFamily: "'Lora', serif" }}>
                    <GraduationCap className="text-primary" size={20} /> Student Information
                  </h2>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Student's Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input name="studentName" required placeholder="Student's name"
                        className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Grade/Year</label>
                      <div className="relative">
                        <input name="gradeLevel" required placeholder="e.g. Year 10"
                          className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Curriculum</label>
                      <select name="curriculum" required className="w-full px-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm appearance-none">
                        <option value="British">British</option>
                        <option value="American">American</option>
                        <option value="Nigerian">Nigerian</option>
                        <option value="IB">International Baccalaureate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Subjects Needed</label>
                    <div className="relative">
                      <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input name="subjects" required placeholder="e.g. Math, Physics, English (comma separated)"
                        className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Additional Message / Behavioral Notes</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 text-muted" size={16} />
                  <textarea name="message" rows={4} placeholder="Tell us more about the student's needs, challenges, or goals..."
                    className="w-full pl-11 pr-4 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none transition-all text-sm resize-none"></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {loading ? "Submitting..." : "Submit Application"}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Mail, Phone, MapPin, Globe, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { submitContactMessage } from "@/app/actions/contact";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await submitContactMessage(formData);

    setIsSubmitting(false);
    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.error || "Something went wrong.");
    }
  }

  return (
    <div className="pt-28 pb-20 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start max-w-[95%] mx-auto">
          {/* Left: Info */}
          <div className="space-y-10 animate-fade-in-up">
            <div className="space-y-4">
              <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Contact Us</p>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                Get in <span className="text-primary italic">Touch</span>
              </h1>
              <p className="text-lg text-muted leading-relaxed max-w-xl" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Have questions about our tutoring programs? We&apos;re here to help you find the perfect path for your child.
              </p>
            </div>

            <div className="space-y-6">
              <ContactItem 
                icon={<Mail size={22} />}
                title="Email Us"
                content="hello@impacttutors.com"
                href="mailto:hello@impacttutors.com"
              />
              <ContactItem 
                icon={<Phone size={22} />}
                title="Call Us"
                content="07014524715"
                href="tel:+2347014524715"
              />
              <ContactItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                title="WhatsApp"
                content="07040599401"
                href="https://wa.me/2347040599401"
              />
              <ContactItem 
                icon={<MapPin size={22} />}
                title="Regions Covered"
                content="UK, USA, Canada, Australia, Germany, Malaysia"
              />
            </div>

            <div className="pt-6 space-y-3 border-t border-border max-w-xs">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted">Follow Us</p>
              <div className="flex gap-3">
                <a href="https://instagram.com/impact_tutors" className="p-3 premium-card rounded-2xl bg-card hover:!bg-primary hover:!text-white hover:!border-primary transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://facebook.com/ImpactTutorsOnlineAcademy" className="p-3 premium-card rounded-2xl bg-card hover:!bg-primary hover:!text-white hover:!border-primary transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="/" className="p-3 premium-card rounded-2xl bg-card hover:!bg-primary hover:!text-white hover:!border-primary transition-all duration-300"><Globe size={18} /></a>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="premium-card rounded-2xl bg-card p-8 md:p-10 animate-fade-in-up delay-200 min-h-[500px] flex flex-col justify-center">
            {isSuccess ? (
              <div className="text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "'Lora', serif" }}>Thank You!</h2>
                <p className="text-muted leading-relaxed max-w-xs mx-auto">
                  Your message has been sent successfully. Our team will get back to you shortly.
                </p>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Lora', serif" }}>Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Full Name</label>
                      <input name="name" type="text" required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm" placeholder="John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Email Address</label>
                      <input name="email" type="email" required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Subject</label>
                    <input name="subject" type="text" required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm" placeholder="How can we help?" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Message</label>
                    <textarea name="message" rows={5} required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm resize-none" placeholder="Tell us more about your needs..."></textarea>
                  </div>
                  
                  {error && (
                    <p className="text-sm text-red-500 font-medium px-1 animate-shake">{error}</p>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContactItemProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  href?: string;
}

function ContactItem({ icon, title, content, href }: ContactItemProps) {
  const Wrapper = href ? "a" : "div";
  return (
    <div className="flex items-center gap-5 group">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted mb-0.5">{title}</p>
        <Wrapper href={href} className={`text-base font-bold ${href ? "hover:text-primary transition-colors duration-300" : ""}`}>
          {content}
        </Wrapper>
      </div>
    </div>
  );
}

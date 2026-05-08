import { Mail, Phone, MapPin, Globe } from "lucide-react";

export default function ContactPage() {
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
                content="+234 813 656 4639 / +234 814 626 5396"
                href="tel:+2348136564639"
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
          <div className="premium-card rounded-2xl bg-card p-8 md:p-10 animate-fade-in-up delay-200">
            <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Lora', serif" }}>Send us a Message</h2>
            <form className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Full Name</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Email Address</label>
                  <input type="email" required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Subject</label>
                <input type="text" required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm" placeholder="How can we help?" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted ml-1">Message</label>
                <textarea rows={5} required className="w-full px-5 py-3.5 bg-section-alt border border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all duration-300 text-sm resize-none" placeholder="Tell us more about your needs..."></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                Send Message
              </button>
            </form>
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

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 pt-20 pb-10 text-white">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        {/* Brand */}
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
              <Image
                src="/images/logo.jpg"
                alt="Impact Tutors Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
              Impact <span className="text-primary">Tutors</span>
            </span>
          </Link>
          <p className="text-slate-400 leading-relaxed max-w-xs text-sm">
            Personalized 1-on-1 tutoring for primary and secondary students. Empowering academic excellence for learners and the diaspora worldwide.
          </p>
          <div className="flex items-center gap-3">
            <SocialLink href="https://instagram.com/impact_tutors" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            } />
            <SocialLink href="https://facebook.com/ImpactTutorsOnlineAcademy" icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            } />
            <SocialLink href="/" icon={<Globe size={16} />} />
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-base font-bold mb-6" style={{ fontFamily: "'Lora', serif" }}>Explore</h4>
          <ul className="space-y-3">
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/about">About Us</FooterLink>
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/courses">Our Courses</FooterLink>
            <FooterLink href="/contact">Contact Support</FooterLink>
          </ul>
        </div>

        {/* Courses Links */}
        <div>
          <h4 className="text-base font-bold mb-6" style={{ fontFamily: "'Lora', serif" }}>Subjects</h4>
          <ul className="space-y-3">
            <FooterLink href="/courses/music-languages">Global Languages</FooterLink>
            <FooterLink href="/courses/coding-for-kids">Coding for Kids</FooterLink>
            <FooterLink href="/courses/k12-math">K-12 Mathematics</FooterLink>
            <FooterLink href="/courses/exam-prep">Exam Preparation</FooterLink>
            <FooterLink href="/courses/foreign-curriculum">Foreign Curriculum</FooterLink>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-base font-bold mb-6" style={{ fontFamily: "'Lora', serif" }}>Get in Touch</h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 group">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-300">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5 uppercase tracking-wider">Email Us</p>
                <a href="mailto:info@impacttutors.com.ng" className="text-sm font-medium hover:text-primary transition-colors duration-300">
                  info@impacttutors.com.ng
                </a>
              </div>
            </li>
            <li className="flex items-start gap-3 group">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-300">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5 uppercase tracking-wider">Contact Us</p>
                <div className="flex flex-col gap-1">
                  <a href="https://wa.me/2347040599401" target="_blank" className="text-sm font-medium hover:text-primary transition-colors duration-300 flex items-center gap-1.5">
                    WhatsApp: 07040599401
                  </a>
                  <a href="tel:+2347014524715" className="text-sm font-medium hover:text-primary transition-colors duration-300">
                    Call: 07014524715
                  </a>
                </div>
              </div>
            </li>
            <li className="flex items-start gap-3 group">
              <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-300">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 mb-0.5 uppercase tracking-wider">Location</p>
                <p className="text-sm font-medium">Headquarters (Online)</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Impact Tutors. All rights reserved.
        </p>
        <div className="flex gap-8 text-sm text-slate-500 font-medium">
          <Link href="/privacy" className="hover:text-white transition-colors duration-300">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors duration-300">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-slate-400 hover:text-primary hover:translate-x-1 inline-block transition-all duration-300 text-sm"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="p-2.5 bg-slate-800 hover:bg-primary text-white rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20"
    >
      {icon}
    </a>
  );
}

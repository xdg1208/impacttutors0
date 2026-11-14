"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Sparkles, GraduationCap, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const router = useRouter();
  const pollCount = useRef(0);

  const studentSteps = [
    {
      title: "Analyzing your profile",
      description: "Our AI is matching you with the perfect tutor for your curriculum...",
      icon: <Sparkles className="text-primary" size={32} />,
    },
    {
      title: "Confirming Curriculum",
      description: "Finalizing course materials for your specific grade level...",
      icon: <BookOpen className="text-primary" size={32} />,
    },
    {
      title: "Assigning Expert Tutor",
      description: "Matching you with a verified educator specialized in your subjects...",
      icon: <GraduationCap className="text-primary" size={32} />,
    },
    {
      title: "Ready for Launch",
      description: "Your personalized dashboard is being prepared.",
      icon: <CheckCircle2 className="text-green-500" size={32} />,
    }
  ];

  const tutorSteps = [
    {
      title: "Verifying Credentials",
      description: "Our academic board is reviewing your subject expertise and files...",
      icon: <Sparkles className="text-primary" size={32} />,
    },
    {
      title: "Course Preparation",
      description: "Structuring your teaching environment and materials...",
      icon: <BookOpen className="text-primary" size={32} />,
    },
    {
      title: "Class Matching",
      description: "Finalizing your first student assignments based on your schedule...",
      icon: <GraduationCap className="text-primary" size={32} />,
    },
    {
      title: "Account Activated",
      description: "Your teaching dashboard is ready for your first lesson.",
      icon: <CheckCircle2 className="text-green-500" size={32} />,
    }
  ];

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/profiles/me/');
        if (res.ok) {
          const profile = await res.json();
          setRole(profile.role);
          if (profile.is_onboarded) {
            router.push("/dashboard");
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }

    checkOnboarding();

    // Step animation interval
    const interval = setInterval(() => {
      setStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 3000);

    // Poll for onboarding completion — capped so a never-activated account
    // stops hammering the API forever (previously polled every 5s eternally).
    const MAX_POLLS = 60; // 5 minutes at 5s intervals
    const pollOnboarding = setInterval(() => {
      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        clearInterval(pollOnboarding);
        setTimedOut(true);
        return;
      }
      checkOnboarding();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(pollOnboarding);
    };
  }, [router]);

  const activeSteps = role === 'tutor' ? tutorSteps : studentSteps;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-12">
        {/* Main Animation Container */}
        <div className="relative flex justify-center">
          <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
             <motion.div 
               className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             />
             <AnimatePresence mode="wait">
               <motion.div
                 key={step}
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 1.5, opacity: 0 }}
                 className="flex items-center justify-center"
               >
                 {activeSteps[step].icon}
               </motion.div>
             </AnimatePresence>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="space-y-2"
            >
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Lora', serif" }}>
                {activeSteps[step].title}
              </h1>
              <p className="text-muted text-sm leading-relaxed mx-auto max-w-[280px]">
                {activeSteps[step].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
            <Clock size={12} className="animate-pulse" />
            <span>Setup In Progress</span>
          </div>
        </div>

        {/* Informational Box */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="p-4 bg-primary/5 rounded-2xl border border-primary/10"
        >
          {timedOut ? (
            <p className="text-[11px] text-foreground leading-relaxed flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                Activation is taking longer than usual. We've stopped checking
                automatically — refresh this page in a few minutes, or{" "}
                <a href="/contact" className="text-primary font-bold hover:underline">contact support</a>{" "}
                if your account still isn't activated.
              </span>
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Welcome to Impact Tutors! {role === 'tutor' ? 'Our administration is finalizing your account activation.' : 'An administrator is currently finalizing your personalized course path.'} This usually takes less than 5 minutes.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

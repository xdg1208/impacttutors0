import { GraduationCap, Globe, Code, Music, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Single source of truth for the public course/program catalog.
 *
 * Every page that links to /courses/<slug> (home, courses, footer, sitemap)
 * resolves its slugs from this catalog. Old slugs that were previously used
 * across the site resolve through COURSE_SLUG_ALIASES so no indexed or
 * shared URL breaks.
 */

export interface CourseCategory {
  slug: string;
  title: string;
  /** Short copy for grid cards */
  tagline: string;
  /** Long copy for the detail page */
  description: string;
  features: string[];
  curriculum: string[];
  icon: ReactNode;
  color: string;
}

export const COURSE_CATEGORIES: CourseCategory[] = [
  {
    slug: "k12-adult",
    title: "K-12 & Adult Classes",
    tagline: "Personalized learning for school students and professionals looking to level up.",
    description:
      "From primary fundamentals to advanced professional development, we cover every stage of the learning journey with a dedicated expert tutor.",
    features: [
      "Dedicated 1-on-1 attention",
      "Custom learning plan",
      "Progress tracking for parents",
      "Homework & assignment support",
    ],
    curriculum: [
      "Core subject foundations",
      "Study skills & exam technique",
      "Advanced topic mastery",
      "Real-world application projects",
    ],
    icon: <GraduationCap size={28} />,
    color: "bg-primary",
  },
  {
    slug: "nigerian-languages",
    title: "Nigerian Languages (Yoruba, Igbo, Hausa)",
    tagline: "Master Yoruba, Igbo, and Hausa with native-speaking experts from anywhere in the world.",
    description:
      "Comprehensive 1-on-1 tutoring in the major Nigerian languages. We focus on speaking, writing, and cultural understanding.",
    features: [
      "Fluent conversational skills",
      "Grammar and literature",
      "Cultural nuances",
      "Personalized pace",
    ],
    curriculum: [
      "Basics of Alphabets",
      "Sentence construction",
      "Tones and Accents",
      "Cultural heritage stories",
    ],
    icon: <Globe size={28} />,
    color: "bg-blue-600",
  },
  {
    slug: "coding-for-kids",
    title: "Coding for Kids",
    tagline: "Equip yourself with digital skills: Python, Web Development, and Tech Literacies.",
    description:
      "Ignite your child's creativity with logical thinking and problem-solving through code. We teach modern languages in a fun way.",
    features: [
      "Game development focus",
      "Logical reasoning",
      "Project-based learning",
      "Mentorship sessions",
    ],
    curriculum: [
      "Block-based coding (Scratch)",
      "Web basics (HTML/CSS)",
      "Introduction to Python",
      "Building your first game",
    ],
    icon: <Code size={28} />,
    color: "bg-accent",
  },
  {
    slug: "music",
    title: "Music Classes",
    tagline: "Learn instruments and theory with professional musicians in private sessions.",
    description:
      "Private music lessons with professional musicians — instruments, theory, and performance, tailored to each learner's goals.",
    features: [
      "Instrument mastery (piano, guitar, violin & more)",
      "Music theory & notation",
      "Performance confidence",
      "Exam preparation (ABRSM, Trinity)",
    ],
    curriculum: [
      "Instrument fundamentals",
      "Reading & music theory",
      "Repertoire building",
      "Recital preparation",
    ],
    icon: <Music size={28} />,
    color: "bg-purple-600",
  },
  {
    slug: "exam-prep",
    title: "Global Exam Prep",
    tagline: "Intensive 1-on-1 coaching for international certifications and entrance exams.",
    description:
      "Strategic coaching designed to help students ace their national and international examinations with confidence.",
    features: [
      "Past question focus",
      "Time management tips",
      "Subject-specific strategies",
      "Mock exams",
    ],
    curriculum: [
      "Use of English intensive",
      "Mathematics intensive",
      "Science focus areas",
      "Arts & Social science prep",
    ],
    icon: <ShieldCheck size={28} />,
    color: "bg-slate-800 dark:bg-slate-600",
  },
];

/**
 * Old slugs previously used across the site (home, footer, courses page),
 * mapped to their canonical catalog entries.
 */
export const COURSE_SLUG_ALIASES: Record<string, string> = {
  languages: "nigerian-languages",
  "coding-tech": "coding-for-kids",
  coding: "coding-for-kids",
  "music-languages": "music",
  "k12-math": "k12-adult",
  "foreign-curriculum": "k12-adult",
};

/** Resolve any (canonical or legacy) slug to a catalog entry. */
export function getCourseBySlug(slug: string): CourseCategory | undefined {
  const canonical = COURSE_SLUG_ALIASES[slug] ?? slug;
  return COURSE_CATEGORIES.find((c) => c.slug === canonical);
}

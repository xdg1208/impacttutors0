import type { Metadata } from "next";
import "./globals.css";
import { Nunito, Lora } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Impact Tutors | World-Class 1-on-1 Online Tutoring",
  description:
    "Premium 1-on-1 online tutoring for K-12, Adult learners, Languages, Coding, and Music. Expert-led classes for students in the UK, USA, Canada, Australia, Germany, and Malaysia.",
  keywords: [
    "online tutor",
    "1-on-1 tutoring",
    "K-12 education",
    "coding for kids",
    "music lessons online",
    "language learning",
    "adult education",
    "global tutoring",
    "UK",
    "USA",
    "Canada"
  ],
};

import MarketingLayout from "@/components/layout/MarketingLayout";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${nunito.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <MarketingLayout>{children}</MarketingLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}


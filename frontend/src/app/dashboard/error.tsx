"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-6 shadow-sm">
        <AlertTriangle size={32} />
      </div>
      
      <div className="space-y-3 max-w-md">
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Connection Issue
        </h2>
        <p className="text-muted text-sm leading-relaxed">
          The dashboard is having trouble connecting to the secure gateway. This usually happens when the backend server is waking up or under high load.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all min-w-[140px]"
        >
          <RefreshCw size={18} />
          Reconnect
        </button>
        
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-8 py-3 bg-secondary/10 text-foreground rounded-xl font-bold hover:bg-secondary/20 transition-all min-w-[140px]"
        >
          <Home size={18} />
          Back Home
        </Link>
      </div>

      <div className="mt-12 pt-6 border-t border-border w-full max-w-xs">
        <p className="text-[10px] text-muted font-mono uppercase tracking-[0.2em]">
          Stability Control Center
        </p>
      </div>
    </div>
  );
}

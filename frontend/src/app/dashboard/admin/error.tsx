"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
        <AlertCircle size={40} />
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Lora', serif" }}>
          Something went wrong
        </h2>
        <p className="text-muted text-sm leading-relaxed">
          We encountered an issue while loading the admin dashboard. This is often due to a temporary connection timeout with our server.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
        
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-section text-foreground rounded-xl font-bold hover:bg-section-alt transition-all"
        >
          <Home size={18} />
          Go Home
        </Link>
      </div>

      <p className="text-[10px] text-muted font-mono mt-8 uppercase tracking-widest">
        Error Digest: {error.digest || "N/A"}
      </p>
    </div>
  );
}

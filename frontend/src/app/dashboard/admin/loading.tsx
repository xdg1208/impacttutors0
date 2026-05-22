import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-section rounded-lg" />
          <div className="h-4 w-48 bg-section rounded-md" />
        </div>
        <div className="h-11 w-full max-w-sm bg-section rounded-xl" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-section rounded-2xl border border-border/50" />
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-6">
        <div className="flex border-b border-border gap-6 pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-6 w-20 bg-section rounded" />
          ))}
        </div>
        
        <div className="min-h-[400px] bg-section/30 rounded-2xl border border-border/50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm font-medium">Preparing control center...</span>
            </div>
        </div>
      </div>
    </div>
  );
}

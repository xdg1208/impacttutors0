export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse p-4 md:p-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-2 w-full md:w-1/3">
          <div className="h-8 bg-muted rounded-lg w-3/4"></div>
          <div className="h-4 bg-muted rounded-lg w-1/2"></div>
        </div>
        <div className="h-10 bg-muted rounded-xl w-full md:w-64"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl"></div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="space-y-6">
        <div className="flex gap-4 border-b border-border pb-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-muted rounded-lg w-24"></div>
          ))}
        </div>
        <div className="h-[400px] bg-muted rounded-2xl w-full"></div>
      </div>
    </div>
  );
}

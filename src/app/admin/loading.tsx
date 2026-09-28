export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <div className="h-7 w-48 bg-purple-100 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-purple-100 rounded-xl" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-purple-100" />
            </div>
            <div className="h-8 w-16 bg-purple-200 rounded-lg" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <div className="h-6 w-40 bg-purple-100 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-lg w-full" />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <div className="h-6 w-36 bg-purple-100 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded-md w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

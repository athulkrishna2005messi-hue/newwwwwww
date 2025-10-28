import Skeleton from '@/components/common/Skeleton';

export default function DashboardLoading() {
  return (
    <section aria-busy="true" aria-live="polite" className="space-y-8">
      <header className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-brand-light/50 bg-canvas p-6 shadow-sm">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-brand-dark/80 px-8 py-10 text-white shadow-lg">
        <Skeleton className="h-7 w-44" variant="inverse" />
        <Skeleton className="mt-3 h-4 w-3/4" variant="inverse" />
        <Skeleton className="mt-2 h-4 w-2/3" variant="inverse" />
      </div>
    </section>
  );
}

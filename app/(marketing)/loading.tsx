import Skeleton from '@/components/common/Skeleton';

export default function MarketingLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-brand-light/40 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Skeleton className="h-10 w-32" />
          <div className="hidden gap-3 sm:flex">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-20" />
            ))}
          </div>
        </div>
      </header>
      <main aria-busy="true" aria-live="polite" className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full sm:w-3/4" />
          <Skeleton className="h-12 w-full sm:w-2/3" />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Skeleton className="h-11 w-40" />
            <Skeleton className="h-11 w-40" variant="muted" />
          </div>
        </div>
      </main>
      <footer className="border-t border-brand-light/30 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-16" />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

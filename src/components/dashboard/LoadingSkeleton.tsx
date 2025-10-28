interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className="card">
      <div className="skeleton" style={{ height: '1.5rem', width: '30%', marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: '2.5rem', marginBottom: '0.75rem' }} />
      {[...Array(rows)].map((_, index) => (
        <div key={index} className="skeleton" style={{ height: '1.25rem', marginBottom: '0.5rem' }} />
      ))}
    </div>
  );
}

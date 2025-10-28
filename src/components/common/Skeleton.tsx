import type { HTMLAttributes } from 'react';

type SkeletonVariant = 'default' | 'muted' | 'inverse';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
};

const variantMap: Record<SkeletonVariant, string> = {
  default: 'bg-brand-light/40',
  muted: 'bg-slate-200/70 dark:bg-slate-700/40',
  inverse: 'bg-white/30',
};

export default function Skeleton({ className = '', variant = 'default', ...rest }: SkeletonProps) {
  const classes = ['animate-pulse', 'rounded-md', variantMap[variant], className].filter(Boolean).join(' ');

  return <div aria-hidden="true" {...rest} className={classes} />;
}

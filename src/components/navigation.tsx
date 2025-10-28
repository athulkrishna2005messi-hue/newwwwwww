import Link from 'next/link';

const marketingLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#updates', label: 'Updates' },
];

const appLinks = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/feedback', label: 'Feedback' },
  { href: '/app/settings', label: 'Settings' },
];

type Variant = 'marketing' | 'app';

interface NavigationProps {
  variant?: Variant;
}

export default function Navigation({ variant = 'marketing' }: NavigationProps) {
  const links = variant === 'app' ? appLinks : marketingLinks;
  const navLabel = variant === 'app' ? 'Application menu' : 'Primary navigation';

  return (
    <header className="border-b border-brand-light/40 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-heading text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">FF</span>
          <span className="sr-only">FeedbackFlow home</span>
          <span aria-hidden>FeedbackFlow</span>
        </Link>
        <nav aria-label={navLabel} className="flex flex-wrap items-center gap-4 text-sm font-medium text-subtle">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 transition hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

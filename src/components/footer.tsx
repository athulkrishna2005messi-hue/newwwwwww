import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-brand-light/30 bg-white/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} FeedbackFlow. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="#privacy" className="transition hover:text-brand-dark">
            Privacy
          </Link>
          <Link href="#terms" className="transition hover:text-brand-dark">
            Terms
          </Link>
          <Link href="mailto:hello@feedbackflow.io" className="transition hover:text-brand-dark">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}

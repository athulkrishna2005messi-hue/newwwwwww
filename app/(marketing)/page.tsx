import type { Metadata } from 'next';
import Link from 'next/link';

import Footer from '@/components/footer';
import Navigation from '@/components/navigation';

export const metadata: Metadata = {
  title: 'FeedbackFlow — Turn customer feedback into product momentum',
  description:
    'FeedbackFlow helps fast-moving teams capture, organize, and act on customer feedback in one shared hub.',
};

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navigation />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="rounded-full bg-brand-light/40 px-4 py-1 text-sm font-medium text-brand-dark">
            Ship better with every conversation
          </span>
          <h1 className="mt-6 text-4xl font-heading font-semibold text-ink sm:text-5xl">
            Collect feedback, prioritize confidently, delight customers
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-subtle sm:text-xl">
            FeedbackFlow keeps product teams aligned around real customer voices with collaborative workflows,
            intelligent insights, and ready-to-launch release notes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app/dashboard"
              className="rounded-full bg-brand px-6 py-3 text-base font-medium text-white transition hover:bg-brand-dark"
            >
              View the dashboard
            </Link>
            <Link
              href="https://feedbackflow.io"
              className="rounded-full border border-brand-dark px-6 py-3 text-base font-medium text-brand-dark transition hover:bg-brand-light/30"
            >
              Learn more
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

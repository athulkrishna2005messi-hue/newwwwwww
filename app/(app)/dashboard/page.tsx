import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — FeedbackFlow',
  description: 'Product feedback at a glance with prioritized insights.',
};

const highlights = [
  {
    title: 'Inboxes',
    description: 'Connect customer touchpoints for a unified stream of insights ready for triage.',
  },
  {
    title: 'Signals',
    description: 'Surface emerging themes and quantify demand instantly with AI-powered enrichment.',
  },
  {
    title: 'Roadmapping',
    description: 'Translate feedback into aligned product bets and keep stakeholders in the loop.',
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-dark/80">Welcome back</p>
        <h1 className="text-3xl font-heading text-ink sm:text-4xl">Your product feedback command center</h1>
        <p className="max-w-3xl text-base leading-relaxed text-subtle">
          This dashboard demonstrates how FeedbackFlow will soon organize customer signals, quantify demand, and
          accelerate confident product decisions.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((highlight) => (
          <div
            key={highlight.title}
            className="rounded-2xl border border-brand-light/50 bg-canvas p-6 shadow-sm"
          >
            <h2 className="text-xl font-heading text-ink">{highlight.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-subtle">{highlight.description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-brand-dark px-8 py-10 text-white shadow-lg">
        <h2 className="text-2xl font-heading">Invite teammates</h2>
        <p className="mt-3 max-w-2xl text-sm text-brand-light">
          Collaborate on shaping product direction by syncing productboard, Jira, and Slack. Authentication and
          workspace management integrations will arrive in upcoming releases.
        </p>
      </div>
    </section>
  );
}

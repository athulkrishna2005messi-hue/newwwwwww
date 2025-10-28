import Link from 'next/link';
import type { Metadata } from 'next';

import EmptyState from '@/components/common/EmptyState';
import { getHuggingFaceClientConfig } from '@/lib/server/hugging-face-client';

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
  const huggingFace = getHuggingFaceClientConfig();
  const huggingFaceConfigured = Boolean(huggingFace.apiKey);

  return (
    <section aria-labelledby="dashboard-heading" className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-dark/80">Welcome back</p>
        <h1 id="dashboard-heading" className="text-3xl font-heading text-ink sm:text-4xl">
          Your product feedback command center
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-subtle">
          This dashboard demonstrates how FeedbackFlow will soon organize customer signals, quantify demand, and
          accelerate confident product decisions.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {highlights.map((highlight, index) => {
          const highlightId = `dashboard-highlight-${index}`;

          return (
            <article
              key={highlight.title}
              className="rounded-2xl border border-brand-light/50 bg-canvas p-6 shadow-sm"
              aria-labelledby={highlightId}
            >
              <h2 id={highlightId} className="text-xl font-heading text-ink">
                {highlight.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-subtle">{highlight.description}</p>
            </article>
          );
        })}
      </div>

      <section aria-labelledby="ai-status-heading" className="space-y-4">
        <div className="rounded-2xl border border-brand-dark/10 bg-white px-8 py-8 shadow-sm">
          <div className="space-y-3">
            <h2 id="ai-status-heading" className="text-2xl font-heading text-ink">
              AI enrichment status
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-subtle">
              Configure Hugging Face credentials to unlock automatic summarization, categorization, and prioritization
              for every piece of feedback you capture.
            </p>
          </div>

          {huggingFaceConfigured ? (
            <div className="mt-6 rounded-xl border border-brand-light/40 bg-brand-light/20 p-5 text-sm text-brand-dark">
              <p className="font-medium">Hugging Face connection is active</p>
              <p className="mt-1 text-brand-dark/80">
                Requests will be sent to <span className="font-mono">{huggingFace.endpoint}</span>. Monitor usage in your
                Hugging Face dashboard to stay within quota.
              </p>
            </div>
          ) : (
            <EmptyState
              title="Connect Hugging Face"
              description="Add your Hugging Face API key to enable AI-powered enrichment. Make sure the token has access to the inference endpoints you plan to call."
              primaryAction={
                <Link
                  href="https://huggingface.co/settings/tokens"
                  className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                  target="_blank"
                  rel="noreferrer"
                >
                  Generate token
                </Link>
              }
              secondaryAction={
                <Link
                  href="https://huggingface.co/docs/api-inference/index"
                  className="text-sm font-medium text-brand-dark underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read integration guide
                </Link>
              }
              className="mt-6 bg-canvas"
            />
          )}
        </div>
      </section>

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

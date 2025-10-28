import type { Metadata } from 'next';

import KnowledgeBaseManager from '@/components/kb/knowledge-base-manager';
import { canManageKnowledgeBase, getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Knowledge Base — FeedbackFlow',
  description: 'Create, curate, and manage reusable knowledge for your team.',
};

export default function KnowledgeBasePage() {
  const user = getCurrentUser();
  const canManage = canManageKnowledgeBase(user);

  if (!canManage) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-heading text-ink">Knowledge base</h1>
          <p className="text-sm text-subtle">
            You need admin privileges or the knowledge base feature flag enabled to access this area.
          </p>
        </header>
        <div className="rounded-2xl border border-brand-light/60 bg-white px-8 py-10 text-center text-sm text-subtle">
          Request access from an administrator to continue managing knowledge base content.
        </div>
      </section>
    );
  }

  return <KnowledgeBaseManager user={user} />;
}

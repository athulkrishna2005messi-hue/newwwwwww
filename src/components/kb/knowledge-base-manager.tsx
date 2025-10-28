'use client';

import { useEffect, useState } from 'react';

import { AppUser } from '@/lib/auth';
import { requestEmbedding } from '@/lib/embeddings/api';
import { chunkEmbedding } from '@/lib/embeddings/storage';
import { KB_ENTRY_LIMIT, createKbEntry, deleteKbEntry, getKbEntries, KbEntry, updateKbEntry } from '@/services/kb';

import KbEntryCard from './kb-entry-card';
import KbEntryForm from './kb-entry-form';
import KbModal from './kb-modal';

interface KnowledgeBaseManagerProps {
  user: AppUser;
}

function embeddingInputFromContent(title: string, body: string) {
  return `${title}\n\n${body}`.trim();
}

export default function KnowledgeBaseManager({ user }: KnowledgeBaseManagerProps) {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KbEntry | null>(null);
  const [entryPendingDeletion, setEntryPendingDeletion] = useState<KbEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getKbEntries(user.id, KB_ENTRY_LIMIT);
        if (!cancelled) {
          setEntries(data);
          setError(null);
        }
      } catch (error_) {
        if (!cancelled) {
          setError((error_ as Error).message || 'Failed to load knowledge base entries.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  function closeModals() {
    setIsCreateOpen(false);
    setEditingEntry(null);
  }

  async function handleCreate(values: { title: string; body: string; tags: string[] }) {
    try {
      setIsSaving(true);
      setError(null);
      setStatus(null);

      const embeddingVector = await requestEmbedding(embeddingInputFromContent(values.title, values.body));
      const entry = await createKbEntry({
        ownerId: user.id,
        title: values.title,
        body: values.body,
        tags: values.tags,
        embedding: chunkEmbedding(embeddingVector),
      });

      setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, KB_ENTRY_LIMIT));
      setStatus('Knowledge base entry created successfully.');
      closeModals();
    } catch (error_) {
      setError((error_ as Error).message || 'Failed to create knowledge base entry.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: { title: string; body: string; tags: string[] }) {
    if (!editingEntry) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setStatus(null);

      const embeddingVector = await requestEmbedding(embeddingInputFromContent(values.title, values.body));
      const updatedEntry = await updateKbEntry(editingEntry.id, user.id, {
        title: values.title,
        body: values.body,
        tags: values.tags,
        embedding: chunkEmbedding(embeddingVector),
      });

      setEntries((current) => {
        const updated = current
          .map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

        return updated.slice(0, KB_ENTRY_LIMIT);
      });
      setStatus('Knowledge base entry updated.');
      closeModals();
    } catch (error_) {
      setError((error_ as Error).message || 'Failed to update knowledge base entry.');
    } finally {
      setIsSaving(false);
    }
  }

  function promptDelete(entry: KbEntry) {
    setStatus(null);
    setError(null);
    setEntryPendingDeletion(entry);
  }

  async function confirmDelete() {
    if (!entryPendingDeletion) {
      return;
    }

    try {
      setDeletingId(entryPendingDeletion.id);
      setError(null);
      setStatus(null);
      await deleteKbEntry(entryPendingDeletion.id, user.id);
      setEntries((current) => current.filter((item) => item.id !== entryPendingDeletion.id));
      setStatus('Knowledge base entry deleted.');
    } catch (error_) {
      setError((error_ as Error).message || 'Failed to delete knowledge base entry.');
    } finally {
      setDeletingId(null);
      setEntryPendingDeletion(null);
    }
  }

  function closeDeletionModal() {
    if (deletingId) {
      return;
    }

    setEntryPendingDeletion(null);
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-dark/70">Knowledge Base</p>
          <h1 className="text-3xl font-heading text-ink">Centralize product and support knowledge</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-subtle">
            Draft canonical answers for your team, enrich them with embeddings, and keep your support channels aligned.
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            setStatus(null);
            setError(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          + New entry
        </button>
      </header>

      {status ? <div className="rounded-lg border border-brand-light/60 bg-brand-light/30 px-4 py-3 text-sm text-brand-dark">{status}</div> : null}
      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-2xl bg-canvas" />
          <div className="h-24 animate-pulse rounded-2xl bg-canvas" />
          <div className="h-24 animate-pulse rounded-2xl bg-canvas" />
        </div>
      ) : entries.length ? (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <KbEntryCard
              key={entry.id}
              entry={entry}
              isDeleting={deletingId === entry.id}
              onEdit={() => {
                setStatus(null);
                setError(null);
                setEditingEntry(entry);
              }}
              onDelete={() => promptDelete(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-light/60 bg-white px-8 py-12 text-center">
          <h2 className="text-lg font-heading text-ink">No entries yet</h2>
          <p className="mt-2 text-sm text-subtle">
            Create your first article to give agents and teammates reliable answers.
          </p>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 rounded-lg border border-brand-light/60 px-4 py-2 text-sm font-medium text-subtle transition hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start a new entry
          </button>
        </div>
      )}

      <KbModal
        open={isCreateOpen}
        title="Create knowledge base entry"
        description="Add the canonical response or guidance you want to reuse during support triage."
        onClose={closeModals}
      >
        <KbEntryForm submitLabel="Create entry" onSubmit={handleCreate} isSubmitting={isSaving} onCancel={closeModals} />
      </KbModal>

      <KbModal
        open={Boolean(editingEntry)}
        title="Edit knowledge base entry"
        description="Update content and regenerate embeddings to keep responses accurate."
        onClose={closeModals}
      >
        {editingEntry ? (
          <KbEntryForm
            defaultValues={{
              title: editingEntry.title,
              body: editingEntry.body,
              tags: editingEntry.tags,
            }}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            isSubmitting={isSaving}
            onCancel={closeModals}
          />
        ) : null}
      </KbModal>

      <KbModal
        open={Boolean(entryPendingDeletion)}
        title="Delete knowledge base entry"
        description="This action cannot be undone."
        onClose={closeDeletionModal}
      >
        {entryPendingDeletion ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-subtle">
              Are you sure you want to delete{' '}
              <span className="font-medium text-ink">“{entryPendingDeletion.title}”</span>? This will remove its embeddings from
              your workspace.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={closeDeletionModal}
                className="rounded-lg border border-brand-light/60 px-4 py-2 text-sm font-medium text-subtle transition hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={confirmDelete}
                className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId ? 'Deleting…' : 'Delete entry'}
              </button>
            </div>
          </div>
        ) : null}
      </KbModal>
    </section>
  );
}

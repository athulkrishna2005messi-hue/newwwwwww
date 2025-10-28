'use client';

import { KbEntry } from '@/services/kb';

interface KbEntryCardProps {
  entry: KbEntry;
  onEdit: (entry: KbEntry) => void;
  onDelete: (entry: KbEntry) => void;
  isDeleting?: boolean;
}

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatUpdatedAt(date: Date) {
  try {
    return formatter.format(date);
  } catch (error) {
    return date.toISOString();
  }
}

export default function KbEntryCard({ entry, onEdit, onDelete, isDeleting }: KbEntryCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-brand-light/60 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-heading text-ink">{entry.title}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-subtle">Updated {formatUpdatedAt(entry.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="rounded-lg border border-brand-light/60 px-3 py-1 text-xs font-medium text-subtle transition hover:border-brand hover:text-brand-dark"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            disabled={isDeleting}
            className="rounded-lg border border-brand-light/60 px-3 py-1 text-xs font-medium text-subtle transition hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </header>
      <p className="text-sm leading-relaxed text-subtle">{entry.body}</p>
      {entry.tags.length ? (
        <ul className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-brand-light/60 bg-brand-light/40 px-3 py-1 text-xs font-medium text-brand-dark"
            >
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

'use client';

import { ReactNode, useEffect } from 'react';

interface KbModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  description?: string;
}

export default function KbModal({ open, title, onClose, children, description }: KbModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl rounded-2xl border border-brand-light/60 bg-white p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-brand-light/60 px-3 py-1 text-xs font-medium text-subtle transition hover:border-brand hover:text-brand-dark"
        >
          Close
        </button>
        <div className="space-y-2 pr-10">
          <h2 className="text-2xl font-heading text-ink">{title}</h2>
          {description ? <p className="text-sm leading-relaxed text-subtle">{description}</p> : null}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

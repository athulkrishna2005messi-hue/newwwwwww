'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface KbEntryFormProps {
  defaultValues?: {
    title?: string;
    body?: string;
    tags?: string[];
  };
  submitLabel: string;
  onSubmit: (values: { title: string; body: string; tags: string[] }) => Promise<void> | void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

interface KbEntryFormValues {
  title: string;
  body: string;
  tags: string;
}

const TITLE_MIN_LENGTH = 5;
const TITLE_MAX_LENGTH = 120;
const BODY_MIN_LENGTH = 20;
const BODY_MAX_LENGTH = 5000;
const MAX_TAGS = 10;

function formatTags(tags?: string[]): string {
  if (!tags || !tags.length) {
    return '';
  }

  return tags.join(', ');
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag, index, array) => tag.length > 0 && array.indexOf(tag) === index)
    .slice(0, MAX_TAGS);
}

export default function KbEntryForm({ defaultValues, submitLabel, onSubmit, isSubmitting, onCancel }: KbEntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
    reset,
  } = useForm<KbEntryFormValues>({
    defaultValues: {
      title: defaultValues?.title ?? '',
      body: defaultValues?.body ?? '',
      tags: formatTags(defaultValues?.tags),
    },
  });

  useEffect(() => {
    reset({
      title: defaultValues?.title ?? '',
      body: defaultValues?.body ?? '',
      tags: formatTags(defaultValues?.tags),
    });
  }, [defaultValues, reset]);

  const submitting = isSubmitting ?? formSubmitting;

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      body: values.body.trim(),
      tags: parseTags(values.tags),
    });
  });

  return (
    <form className="space-y-6" onSubmit={submitHandler}>
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-ink">
          Title
        </label>
        <input
          id="title"
          type="text"
          autoComplete="off"
          className="w-full rounded-lg border border-brand-light/60 bg-white px-3 py-2 text-sm text-ink shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"
          placeholder="Summarize the issue or question"
          {...register('title', {
            required: 'A title is required.',
            minLength: {
              value: TITLE_MIN_LENGTH,
              message: `Title must be at least ${TITLE_MIN_LENGTH} characters long.`,
            },
            maxLength: {
              value: TITLE_MAX_LENGTH,
              message: `Title must be fewer than ${TITLE_MAX_LENGTH} characters.`,
            },
          })}
        />
        {errors.title ? <p className="text-xs text-brand-dark">{errors.title.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="block text-sm font-medium text-ink">
          Body
        </label>
        <textarea
          id="body"
          rows={6}
          className="w-full rounded-xl border border-brand-light/60 bg-white px-3 py-2 text-sm leading-relaxed text-ink shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"
          placeholder="Provide the full context, troubleshooting steps, or the solution."
          {...register('body', {
            required: 'Body content is required.',
            minLength: {
              value: BODY_MIN_LENGTH,
              message: `Body must be at least ${BODY_MIN_LENGTH} characters long.`,
            },
            maxLength: {
              value: BODY_MAX_LENGTH,
              message: `Body must be fewer than ${BODY_MAX_LENGTH} characters.`,
            },
          })}
        />
        <div className="flex items-center justify-between text-xs text-subtle">
          {errors.body ? <p className="text-brand-dark">{errors.body.message}</p> : null}
          <p>{BODY_MAX_LENGTH} character limit</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="tags" className="block text-sm font-medium text-ink">
          Tags (optional)
        </label>
        <input
          id="tags"
          type="text"
          className="w-full rounded-lg border border-brand-light/60 bg-white px-3 py-2 text-sm text-ink shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"
          placeholder="Separate tags with commas — e.g. onboarding, billing"
          {...register('tags', {
            validate: (value) => {
              const tags = parseTags(value);
              return tags.length <= MAX_TAGS || `Use up to ${MAX_TAGS} tags.`;
            },
          })}
        />
        <p className="text-xs text-subtle">Use tags to group similar knowledge base entries.</p>
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-light/60 px-4 py-2 text-sm font-medium text-subtle transition hover:border-brand hover:text-brand-dark"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

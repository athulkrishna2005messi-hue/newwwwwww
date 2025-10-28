'use client';

import { useEffect } from 'react';

type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

type MonitoringRecord = {
  message: string;
  level?: LogLevel;
  error?: Error;
  context?: LogContext;
  tags?: string[];
};

const NAMESPACE = 'FeedbackFlow';

function emitLog({ level = 'info', message, error, context, tags }: MonitoringRecord) {
  const namespace = `[${NAMESPACE}]`;
  const tagLabel = tags && tags.length > 0 ? `(${tags.join(', ')})` : '';
  const payload: LogContext = { ...(context ?? {}) };

  if (error) {
    payload.name = error.name;
    payload.message = error.message;
    payload.stack = error.stack;
  }

  const header = `${namespace} ${message} ${tagLabel}`.trim();
  const details = error ? [header, payload, error] : [header, payload];

  switch (level) {
    case 'error':
      console.error(...details);
      break;
    case 'warn':
      console.warn(...details);
      break;
    default:
      console.info(...details);
  }
}

export function report(record: MonitoringRecord) {
  emitLog(record);
}

interface ReportErrorOptions {
  context?: LogContext;
  level?: Exclude<LogLevel, 'info'>;
  message?: string;
  tags?: string[];
}

export function reportError(error: Error, options: ReportErrorOptions = {}) {
  const { context, level = 'error', message = error.message, tags } = options;

  report({
    error,
    level,
    message,
    tags,
    context: {
      ...context,
      digest: (error as { digest?: string }).digest,
    },
  });
}

interface ErrorReporterOptions {
  component?: string;
  context?: LogContext;
  message?: string;
  tags?: string[];
}

export function useErrorReporter(error: Error | null | undefined, options: ErrorReporterOptions = {}) {
  const { component, context, message, tags } = options;

  useEffect(() => {
    if (!error) {
      return;
    }

    const resolvedMessage =
      message ?? (component ? `Unhandled error in ${component}` : 'An unexpected error occurred');

    reportError(error, {
      context,
      message: resolvedMessage,
      tags,
    });
  }, [component, context, error, message, tags]);
}

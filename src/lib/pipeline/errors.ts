export class PipelineError extends Error {
  constructor(message: string, public readonly metadata?: Record<string, unknown>) {
    super(message);
    this.name = 'PipelineError';
  }
}

export class RateLimitError extends PipelineError {
  constructor(message = 'Rate limit exceeded', metadata?: Record<string, unknown>) {
    super(message, metadata);
    this.name = 'RateLimitError';
  }
}

export const isRateLimitError = (error: unknown): error is RateLimitError => {
  if (!error) {
    return false;
  }

  if (error instanceof RateLimitError) {
    return true;
  }

  if (typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    if (candidate['code'] === 429 || candidate['status'] === 429) {
      return true;
    }
    if (typeof candidate['name'] === 'string' && candidate['name'] === 'RateLimitError') {
      return true;
    }
  }

  return false;
};

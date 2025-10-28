import { PipelineError } from '@/lib/pipeline/errors';
import type { PipelineQuotaService } from '@/lib/pipeline/types';

export interface QuotaOptions {
  monthlyLimit: number;
  initialUsage?: number;
}

export class SimpleQuotaService implements PipelineQuotaService {
  private usage: number;
  private readonly limit: number;

  constructor(options: QuotaOptions) {
    this.limit = options.monthlyLimit;
    this.usage = options.initialUsage ?? 0;
  }

  async ensureWithinQuota(count: number): Promise<void> {
    if (this.limit <= 0) {
      throw new PipelineError('Monthly quota limit is not configured');
    }

    if (this.usage + count > this.limit) {
      throw new PipelineError('Monthly quota exceeded', {
        limit: this.limit,
        usage: this.usage,
        requested: count
      });
    }
  }

  async registerUsage(count: number): Promise<void> {
    this.usage += count;
  }
}

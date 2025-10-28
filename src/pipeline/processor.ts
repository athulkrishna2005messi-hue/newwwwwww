import { getRemainingQuota, incrementProcessedCount, isQuotaAvailable, resetMonthlyUsageIfNeeded, type User } from "@/types/user";

export interface PipelineItem<T = unknown> {
  id: string;
  payload: T;
}

export type PipelineHandler<T = unknown> = (item: PipelineItem<T>, user: Readonly<User>) => Promise<void> | void;

export interface UpgradePrompt {
  component: "UpgradeModal";
  props: {
    remainingQuota: number;
    totalQuota: number;
    user: User;
    message: string;
  };
}

export interface PipelineHalt {
  reason: "quota_exceeded";
  prompt: UpgradePrompt;
}

export interface PipelineResult {
  processed: number;
  halted: boolean;
  halt?: PipelineHalt;
  user: User;
  remainingQuota: number;
}

export interface PipelineOptions<T = unknown> {
  now?: Date;
  beforeProcess?: (item: PipelineItem<T>, user: Readonly<User>) => void;
  afterProcess?: (item: PipelineItem<T>, user: Readonly<User>) => void;
  onHalt?: (halt: PipelineHalt) => void;
  showUpgradeModal?: (prompt: UpgradePrompt) => void;
}

export async function processPipeline<T = unknown>(
  user: User,
  items: PipelineItem<T>[],
  handler: PipelineHandler<T>,
  options: PipelineOptions<T> = {}
): Promise<PipelineResult> {
  const nowFactory = () => options.now ?? new Date();
  let currentUser = resetMonthlyUsageIfNeeded(user, nowFactory());
  let processed = 0;

  for (const item of items) {
    const refreshed = resetMonthlyUsageIfNeeded(currentUser, nowFactory());
    if (refreshed !== currentUser) {
      currentUser = refreshed;
    }

    if (!currentUser.isWhopSubscriber && !isQuotaAvailable(currentUser)) {
      const prompt = buildUpgradePrompt(currentUser);
      const halt: PipelineHalt = {
        reason: "quota_exceeded",
        prompt
      };
      options.onHalt?.(halt);
      options.showUpgradeModal?.(prompt);

      return {
        processed,
        halted: true,
        halt,
        user: currentUser,
        remainingQuota: 0
      };
    }

    options.beforeProcess?.(item, currentUser);
    await handler(item, currentUser);
    processed += 1;

    if (!currentUser.isWhopSubscriber) {
      currentUser = incrementProcessedCount(currentUser, 1);
    }

    options.afterProcess?.(item, currentUser);
  }

  return {
    processed,
    halted: false,
    user: currentUser,
    remainingQuota: currentUser.isWhopSubscriber ? Number.POSITIVE_INFINITY : getRemainingQuota(currentUser)
  };
}

function buildUpgradePrompt(user: User): UpgradePrompt {
  const remaining = Math.max(0, user.monthlyQuota - user.processedThisMonth);
  return {
    component: "UpgradeModal",
    props: {
      remainingQuota: remaining,
      totalQuota: user.monthlyQuota,
      user,
      message:
        remaining === 0
          ? "You have reached your free monthly quota. Upgrade to continue processing immediately."
          : `You are approaching your monthly quota. Only ${remaining} item${remaining === 1 ? "" : "s"} remaining.`
    }
  };
}

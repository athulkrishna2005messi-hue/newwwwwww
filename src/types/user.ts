export const DEFAULT_MONTHLY_QUOTA = 30;

export interface User {
  id: string;
  email: string;
  name?: string;
  monthlyQuota: number;
  processedThisMonth: number;
  quotaResetAt: string;
  isWhopSubscriber: boolean;
}

export type UserUpdate = Partial<Omit<User, "id">>;

const MONTH_KEYS = ["getUTCFullYear", "getUTCMonth"] as const satisfies readonly (keyof Date)[];

function startOfMonthIso(date: Date): string {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return normalized.toISOString();
}

function isSameMonth(a: Date | undefined | null, b: Date): boolean {
  if (!a) return false;
  return MONTH_KEYS.every((key) => a[key]() === b[key]());
}

export function createUser(partial: Pick<User, "id" | "email"> & Partial<User>): User {
  const now = new Date();
  const resetAt = partial.quotaResetAt ? new Date(partial.quotaResetAt) : undefined;
  const normalizedResetAt = isSameMonth(resetAt, now)
    ? startOfMonthIso(resetAt ?? now)
    : startOfMonthIso(now);

  return {
    id: partial.id,
    email: partial.email,
    name: partial.name,
    monthlyQuota: partial.monthlyQuota ?? DEFAULT_MONTHLY_QUOTA,
    processedThisMonth: Math.max(0, partial.processedThisMonth ?? 0),
    quotaResetAt: normalizedResetAt,
    isWhopSubscriber: partial.isWhopSubscriber ?? false
  };
}

export function resetMonthlyUsageIfNeeded(user: User, referenceDate: Date = new Date()): User {
  const resetAt = user.quotaResetAt ? new Date(user.quotaResetAt) : undefined;
  if (resetAt && isSameMonth(resetAt, referenceDate)) {
    return user;
  }

  return {
    ...user,
    processedThisMonth: 0,
    quotaResetAt: startOfMonthIso(referenceDate)
  };
}

export function incrementProcessedCount(user: User, amount = 1): User {
  if (amount <= 0) return user;
  const nextCount = user.processedThisMonth + amount;
  return {
    ...user,
    processedThisMonth: nextCount
  };
}

export function getRemainingQuota(user: User): number {
  if (user.isWhopSubscriber) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, user.monthlyQuota - user.processedThisMonth);
}

export function isQuotaAvailable(user: User): boolean {
  return user.isWhopSubscriber || user.processedThisMonth < user.monthlyQuota;
}

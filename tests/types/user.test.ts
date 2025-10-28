import { describe, expect, it } from "vitest";
import { DEFAULT_MONTHLY_QUOTA, createUser, getRemainingQuota, incrementProcessedCount, resetMonthlyUsageIfNeeded } from "@/types/user";

describe("user quota helpers", () => {
  it("initializes with defaults", () => {
    const user = createUser({ id: "user-1", email: "test@example.com" });
    expect(user.monthlyQuota).toBe(DEFAULT_MONTHLY_QUOTA);
    expect(user.processedThisMonth).toBe(0);
    expect(user.isWhopSubscriber).toBe(false);
  });

  it("resets processed count when month changes", () => {
    const now = new Date("2024-06-15T12:00:00.000Z");
    const nextMonth = new Date("2024-07-02T04:00:00.000Z");
    const user = createUser({ id: "user-reset", email: "reset@example.com", processedThisMonth: 12, quotaResetAt: now.toISOString() });

    const updated = resetMonthlyUsageIfNeeded(user, nextMonth);
    expect(updated.processedThisMonth).toBe(0);
    expect(new Date(updated.quotaResetAt).getUTCMonth()).toBe(nextMonth.getUTCMonth());
  });

  it("keeps processed count in same month", () => {
    const now = new Date("2024-06-15T12:00:00.000Z");
    const later = new Date("2024-06-20T12:00:00.000Z");
    const user = createUser({ id: "user-same-month", email: "same@example.com", processedThisMonth: 8, quotaResetAt: now.toISOString() });

    const updated = resetMonthlyUsageIfNeeded(user, later);
    expect(updated.processedThisMonth).toBe(8);
  });

  it("reports remaining quota for subscribers as infinite", () => {
    const user = createUser({ id: "subscriber", email: "pro@example.com", isWhopSubscriber: true });
    const incremented = incrementProcessedCount(user, 1000);
    expect(getRemainingQuota(incremented)).toBe(Number.POSITIVE_INFINITY);
  });
});

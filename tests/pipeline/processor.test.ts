import { describe, expect, it, vi } from "vitest";
import { processPipeline } from "@/pipeline/processor";
import { createUser } from "@/types/user";

describe("processPipeline", () => {
  it("processes all items while under quota", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const user = createUser({ id: "user-free", email: "free@example.com", monthlyQuota: 3 });
    const items = [1, 2, 3].map((value) => ({ id: `item-${value}`, payload: value }));

    const result = await processPipeline(user, items, handler);

    expect(result.processed).toBe(3);
    expect(result.halted).toBe(false);
    expect(result.user.processedThisMonth).toBe(3);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("halts processing when quota is exceeded and surfaces upgrade prompt", async () => {
    const user = createUser({ id: "user-limit", email: "limit@example.com", monthlyQuota: 2, processedThisMonth: 2 });
    const handler = vi.fn();
    const showModal = vi.fn();
    const result = await processPipeline(user, [{ id: "item-1", payload: null }], handler, { showUpgradeModal: showModal });

    expect(result.halted).toBe(true);
    expect(result.halt?.reason).toBe("quota_exceeded");
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(result.remainingQuota).toBe(0);
    expect(handler).not.toHaveBeenCalled();
  });

  it("bypasses quota checks for subscribers", async () => {
    const user = createUser({ id: "user-pro", email: "pro@example.com", isWhopSubscriber: true, processedThisMonth: 1000 });
    const items = Array.from({ length: 5 }, (_, index) => ({ id: `item-${index}`, payload: index }));
    const handler = vi.fn().mockResolvedValue(undefined);

    const result = await processPipeline(user, items, handler);

    expect(result.halted).toBe(false);
    expect(result.processed).toBe(5);
    expect(result.remainingQuota).toBe(Number.POSITIVE_INFINITY);
    expect(handler).toHaveBeenCalledTimes(5);
  });

  it("resets monthly quota window before enforcing limits", async () => {
    const now = new Date("2024-05-15T00:00:00.000Z");
    const nextMonth = new Date("2024-06-04T00:00:00.000Z");
    const user = createUser({
      id: "user-reset",
      email: "reset@example.com",
      monthlyQuota: 2,
      processedThisMonth: 2,
      quotaResetAt: now.toISOString()
    });

    const handler = vi.fn().mockResolvedValue(undefined);
    const items = [0, 1].map((index) => ({ id: `item-${index}`, payload: index }));
    const result = await processPipeline(user, items, handler, { now: nextMonth });

    expect(result.halted).toBe(false);
    expect(result.processed).toBe(2);
    expect(result.user.processedThisMonth).toBe(2);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

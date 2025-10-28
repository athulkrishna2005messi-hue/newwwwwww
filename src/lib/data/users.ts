import { createUser, getRemainingQuota, incrementProcessedCount, resetMonthlyUsageIfNeeded, type User, type UserUpdate } from "@/types/user";

const users = new Map<string, User>();

export function clearUsers(): void {
  users.clear();
}

export function upsertUser(partial: Pick<User, "id" | "email"> & Partial<User>): User {
  const existing = users.get(partial.id);
  if (existing) {
    const merged: User = {
      ...existing,
      ...partial
    };
    const normalized = resetMonthlyUsageIfNeeded(merged);
    users.set(normalized.id, normalized);
    return normalized;
  }

  const created = resetMonthlyUsageIfNeeded(createUser(partial));
  users.set(created.id, created);
  return created;
}

export function getUserById(id: string): User | undefined {
  const user = users.get(id);
  if (!user) return undefined;
  const normalized = resetMonthlyUsageIfNeeded(user);
  if (normalized !== user) {
    users.set(normalized.id, normalized);
  }
  return normalized;
}

export function updateUser(id: string, update: UserUpdate): User {
  const current = getUserById(id);
  if (!current) {
    throw new Error(`User with id ${id} not found`);
  }
  const merged: User = {
    ...current,
    ...update
  };
  users.set(merged.id, merged);
  return merged;
}

export function recordProcessedItems(id: string, count: number): User {
  const current = getUserById(id);
  if (!current) {
    throw new Error(`User with id ${id} not found`);
  }

  if (count <= 0 || current.isWhopSubscriber) {
    return current;
  }

  const updated = incrementProcessedCount(current, count);
  users.set(updated.id, updated);
  return updated;
}

export function getRemainingForUser(id: string): number {
  const user = getUserById(id);
  if (!user) {
    throw new Error(`User with id ${id} not found`);
  }
  return getRemainingQuota(user);
}

export function getAllUsers(): User[] {
  return Array.from(users.values()).map((user) => resetMonthlyUsageIfNeeded(user));
}

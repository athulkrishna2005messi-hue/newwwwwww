export type UserRole = 'admin' | 'member';

export interface FeatureFlags {
  knowledgeBase?: boolean;
  [key: string]: boolean | undefined;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  featureFlags?: FeatureFlags;
}

const demoUser: AppUser = {
  id: 'demo-admin',
  email: 'demo-admin@feedbackflow.io',
  name: 'Demo Admin',
  role: 'admin',
  featureFlags: {
    knowledgeBase: true,
  },
};

export function getCurrentUser(): AppUser {
  return demoUser;
}

export function canManageKnowledgeBase(user: AppUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  return user.role === 'admin' || Boolean(user.featureFlags?.knowledgeBase);
}

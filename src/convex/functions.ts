import { makeFunctionReference } from 'convex/server';

export const healthPing = makeFunctionReference<'query', Record<string, never>, { ok: boolean; timestamp: number }>(
  'health:ping',
);

type MeResult = {
  user: { _id: string; email?: string; name?: string } | null;
  profile: { reputation?: number; reviewsCount?: number } | null;
} | null;

export const usersGetMe = makeFunctionReference<'query', Record<string, never>, MeResult>(
  'users:getMe',
);

export const usersEnsureCurrentProfile = makeFunctionReference<'mutation', { name?: string }, { ok: boolean }>(
  'users:ensureCurrentProfile',
);
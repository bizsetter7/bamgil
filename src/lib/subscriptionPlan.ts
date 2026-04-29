type Sub = { plan: string; status: string } | null | undefined;

const ACTIVE_STATUSES = new Set(['active', 'trial']);

export function getActivePlan(sub: Sub): string | null {
  if (!sub) return null;
  return ACTIVE_STATUSES.has(sub.status) ? sub.plan : null;
}

export function getActivePlanFromList(subs?: Sub[] | null): string | null {
  return getActivePlan(subs?.[0]);
}

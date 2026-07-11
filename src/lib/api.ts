import { auth } from './firebase';
import type { Budget, InsightRow } from '@/schemas/budget';
import type { Transaction } from '@/schemas/transaction';
import type { Viewer } from '@/schemas/viewer';

/**
 * The API client - the only file in the app that talks to the network.
 * Every screen goes through here, so auth lives in exactly one place
 * (same seam discipline as the API's repos).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Render's free tier sleeps when idle and takes up to ~50s to wake. Fire
 * this the moment the app opens: by the time the user has typed their
 * password, the server is warm. Fire-and-forget - errors don't matter.
 */
export function wakeServer(): void {
  fetch(`${BASE_URL}/health`).catch(() => {});
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  // Screens behind the login gate should never reach this signed out.
  if (!user) throw new ApiError(401, 'not signed in');

  // getIdToken() returns the cached token and auto-refreshes near the
  // 1-hour expiry - the SDK does what our curl scripts redid by hand.
  const token = await user.getIdToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    // 422 -> field problem the user can fix; 401/403 -> access; 5xx -> retry.
    let message = `request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body - keep the generic message
    }
    throw new ApiError(res.status, message);
  }

  // DELETE endpoints return 204 with an empty body - res.json() would throw.
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Typed helpers - one per endpoint, matching openapi.yaml
// ---------------------------------------------------------------------------

// Insights (the Dashboard)
export const getMonthlyInsights = (month: string) =>
  api<{ month: string; categories: InsightRow[] }>(`/insights/monthly?month=${month}`);

// Transactions
export interface ListTransactionsResult {
  items: Transaction[];
  nextCursor: string | null;
}
export const listTransactions = (opts: { month?: string; limit?: number; cursor?: string } = {}) => {
  const params = new URLSearchParams();
  if (opts.month) params.set('month', opts.month);
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return api<ListTransactionsResult>(`/transactions${qs ? `?${qs}` : ''}`);
};

export const createTransaction = (input: {
  amountCents: number;
  merchantRaw: string;
  occurredAt: string;
  categoryId?: number;
  note?: string;
}) => api<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(input) });

export const updateTransaction = (
  id: string,
  patch: Partial<{ amountCents: number; merchantRaw: string; occurredAt: string; categoryId: number; note: string }>,
) => api<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const deleteTransaction = (id: string) =>
  api<void>(`/transactions/${id}`, { method: 'DELETE' });

// Categorization (the editable chip on the Add-transaction screen)
export const categorizeMerchant = (merchantRaw: string) =>
  api<{ merchantKey: string; categoryId: number; categoryName: string; source: 'cache' | 'llm' | 'fallback' }>(
    '/categorize',
    { method: 'POST', body: JSON.stringify({ merchantRaw }) },
  );

// Budgets
export const listBudgets = (month?: string) =>
  api<{ items: Budget[] }>(`/budgets${month ? `?month=${month}` : ''}`);

export const setBudget = (input: { categoryId: number; month: string; limitCents: number }) =>
  api<Budget>('/budgets', { method: 'POST', body: JSON.stringify(input) });

// Trusted viewers
export const inviteViewer = (email: string) =>
  api<Viewer>('/viewers/invite', { method: 'POST', body: JSON.stringify({ email }) });

export const acceptInvite = (inviteId: string) =>
  api<Viewer>(`/viewers/accept/${inviteId}`, { method: 'POST' });

export const revokeViewer = (id: string) => api<void>(`/viewers/${id}`, { method: 'DELETE' });

export const listMyViewers = () => api<{ items: Viewer[] }>('/viewers');

export const listSharedWithMe = () => api<{ items: Viewer[] }>('/viewers/shared-with-me');

export const getSharedInsights = (ownerUid: string, month: string) =>
  api<{ ownerUid: string; month: string; categories: InsightRow[] }>(
    `/shared/${ownerUid}/insights/monthly?month=${month}`,
  );

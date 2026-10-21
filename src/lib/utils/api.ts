import { json } from '@sveltejs/kit';
import type { ZodError } from 'zod';

export function ok<T>(data: T, status = 200) { return json({ success: true, data }, { status }); }
export function created<T>(data: T) { return json({ success: true, data }, { status: 201 }); }
export function badRequest(message: string, errors?: unknown) { return json({ success: false, message, errors }, { status: 400 }); }
export function unauthorized(message = 'Authentication required') { return json({ success: false, message }, { status: 401 }); }
export function forbidden(message = 'Access denied') { return json({ success: false, message }, { status: 403 }); }
export function notFound(message = 'Not found') { return json({ success: false, message }, { status: 404 }); }
export function conflict(message: string) { return json({ success: false, message }, { status: 409 }); }
export function serverError(message = 'Internal server error', err?: unknown) {
  if (err) console.error('[Server Error]', err);
  return json({ success: false, message }, { status: 500 });
}
export function handleAuthError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === 'Unauthorized') return unauthorized();
    if (err.message === 'Forbidden') return forbidden();
  }
  return null;
}
export function zodError(error: ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) { const p = issue.path.join('.'); if (!errors[p]) errors[p] = issue.message; }
  return json({ success: false, message: 'Validation failed', errors }, { status: 422 });
}
export function getPagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  return { skip: (page - 1) * take, take, page };
}
export function paginatedResponse<T>(data: T[], total: number, page: number, take: number) {
  return { data, pagination: { total, page, limit: take, pages: Math.ceil(total / take), hasNext: page * take < total, hasPrev: page > 1 } };
}
export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
}
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-UG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return formatDate(d);
}
export function formatWeight(kg: number | null | undefined): string {
  if (!kg) return '0 kg';
  if (kg >= 1000) return `${(kg/1000).toFixed(1)} t`;
  return `${kg.toFixed(1)} kg`;
}
export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return 'UGX 0';
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

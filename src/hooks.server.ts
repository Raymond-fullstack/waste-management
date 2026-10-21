import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getUser } from '$lib/server/auth';

const AUTH_ROUTES  = ['/dashboard'];
const GUEST_ROUTES = ['/auth/login', '/auth/register'];
const PUBLIC_API   = ['/api/auth/login', '/api/auth/register', '/api/admin/districts', '/api/admin/zones'];

export const handle: Handle = async ({ event, resolve }) => {
  const user = await getUser(event.cookies);
  event.locals.user = user ?? undefined;
  const path = event.url.pathname;

  if (AUTH_ROUTES.some(r => path.startsWith(r)) && !user) {
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(path)}`);
  }
  if (path.startsWith('/api/') && !PUBLIC_API.some(r => path.startsWith(r)) && !user) {
    return new Response(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (GUEST_ROUTES.some(r => path.startsWith(r)) && user) {
    const routes: Record<string,string> = { HOUSEHOLD:'/dashboard/household', COLLECTOR:'/dashboard/collector', RECYCLER:'/dashboard/recycler', ADMIN:'/dashboard/admin' };
    throw redirect(303, routes[user.role] ?? '/dashboard');
  }
  return resolve(event);
};

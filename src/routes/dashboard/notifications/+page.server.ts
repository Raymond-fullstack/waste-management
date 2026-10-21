// src/routes/dashboard/notifications/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(303, '/auth/login');
  const routes: Record<string, string> = {
    HOUSEHOLD: '/dashboard/household/notifications',
    COLLECTOR: '/dashboard/collector/notifications',
    RECYCLER:  '/dashboard/recycler/notifications',
    ADMIN:     '/dashboard/admin/notifications',
  };
  throw redirect(303, routes[user.role] ?? '/dashboard');
};

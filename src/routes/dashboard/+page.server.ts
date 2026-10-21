import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(303, '/auth/login');
  const routes: Record<string,string> = {
    HOUSEHOLD:'/dashboard/household', COLLECTOR:'/dashboard/collector',
    RECYCLER:'/dashboard/recycler', ADMIN:'/dashboard/admin',
  };
  throw redirect(303, routes[user.role] ?? '/dashboard/household');
};

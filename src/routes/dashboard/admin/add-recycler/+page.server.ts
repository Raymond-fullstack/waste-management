import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  return { user };
};

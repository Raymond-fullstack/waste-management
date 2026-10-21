import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(303, '/auth/login');
  return { user };
};

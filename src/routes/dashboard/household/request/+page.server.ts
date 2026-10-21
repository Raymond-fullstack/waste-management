import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'HOUSEHOLD') throw redirect(303, '/auth/login');
  try {
    const [profile, categories] = await Promise.all([
      prisma.householdProfile.findUnique({ where: { userId: user.sub } }).catch(() => null),
      prisma.wasteCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);
    return { user, profile, categories };
  } catch (err) { console.error(err); return { user, profile: null, categories: [] }; }
};

// src/routes/dashboard/admin/pricing/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');

  try {
    const categories = await prisma.wasteCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { pickupRequests: true } } },
    });
    return { user, categories };
  } catch (err) {
    console.error('[admin/pricing] load error:', err);
    return { user, categories: [] };
  }
};

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const [recyclers, total] = await Promise.all([
      prisma.recyclerProfile.findMany({ skip: (page-1)*limit, take: limit, orderBy: { user: { createdAt: 'desc' } }, include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }, _count: { select: { bids: true } } } }),
      prisma.recyclerProfile.count(),
    ]);
    return { user, recyclers, total, page, limit };
  } catch (err) { console.error(err); return { user, recyclers: [], total: 0, page: 1, limit }; }
};

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'HOUSEHOLD') throw redirect(303, '/auth/login');
  const statusFilter = url.searchParams.get('status') ?? 'ALL';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 15;
  try {
    const where: any = { householdId: user.sub };
    if (statusFilter !== 'ALL') where.status = statusFilter;
    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' }, include: { category: true, assignment: { include: { collector: { include: { user: { select: { name: true, phone: true } } } } } }, rating: true, bids: { include: { recycler: { include: { user: { select: { name: true } } } } } } } }),
      prisma.pickupRequest.count({ where }),
    ]);
    return { user, pickups, total, page, limit, statusFilter };
  } catch (err) { console.error(err); return { user, pickups: [], total: 0, page: 1, limit, statusFilter }; }
};

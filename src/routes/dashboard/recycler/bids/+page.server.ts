// src/routes/dashboard/recycler/bids/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'RECYCLER') throw redirect(303, '/auth/login');
  const statusFilter = url.searchParams.get('status') ?? 'ALL';
  const page  = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const profile = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw redirect(303, '/auth/login');

    const where: any = { recyclerId: profile.id };
    if (statusFilter !== 'ALL') where.status = statusFilter;

    const [bids, total] = await Promise.all([
      prisma.wasteBid.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pickup: {
            include: {
              category: true,
              household: { select: { name: true } },
              assignment: {
                include: { collector: { include: { user: { select: { name: true, phone: true } } } } },
              },
            },
          },
        },
      }),
      prisma.wasteBid.count({ where }),
    ]);

    const bidStats = await prisma.wasteBid.groupBy({
      by: ['status'], where: { recyclerId: profile.id }, _count: true,
    });
    const statsMap = Object.fromEntries(bidStats.map((b: any) => [b.status, b._count]));

    return { user, profile, bids, total, page, limit, statusFilter, statsMap };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    console.error('[recycler/bids] error:', err);
    return { user, profile: null, bids: [], total: 0, page: 1, limit, statusFilter, statsMap: {} };
  }
};

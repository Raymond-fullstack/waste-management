// src/routes/dashboard/recycler/history/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'RECYCLER') throw redirect(303, '/auth/login');
  const page  = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const profile = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw redirect(303, '/auth/login');

    const [acceptedBids, total] = await Promise.all([
      prisma.wasteBid.findMany({
        where: { recyclerId: profile.id, status: 'ACCEPTED' },
        skip: (page - 1) * limit, take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          pickup: {
            include: {
              category: true,
              household: { select: { name: true } },
            },
          },
        },
      }),
      prisma.wasteBid.count({ where: { recyclerId: profile.id, status: 'ACCEPTED' } }),
    ]);

    const now = new Date();
    const monthlyData = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const m   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
        return prisma.wasteBid.aggregate({
          where: { recyclerId: profile.id, status: 'ACCEPTED', updatedAt: { gte: m, lt: end } },
          _sum: { totalOffer: true }, _count: true,
        }).then(r => ({
          label: m.toLocaleDateString('en-UG', { month: 'short' }),
          value: r._sum.totalOffer ?? 0,
          count: r._count,
        }));
      })
    );

    const totals = await prisma.wasteBid.aggregate({
      where: { recyclerId: profile.id, status: 'ACCEPTED' },
      _sum: { totalOffer: true }, _count: true,
    });

    return {
      user, profile, acceptedBids, total, page, limit, monthlyData,
      totalSpend:     totals._sum.totalOffer ?? 0,
      totalContracts: totals._count,
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    console.error('[recycler/history] error:', err);
    return {
      user, profile: null, acceptedBids: [], total: 0, page: 1, limit,
      monthlyData: [], totalSpend: 0, totalContracts: 0,
    };
  }
};

// src/routes/dashboard/collector/earnings/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'COLLECTOR') throw redirect(303, '/auth/login');
  try {
    const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw redirect(303, '/auth/login');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [transactions, monthlyData, weeklyEarnings, monthlyEarnings] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.sub },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const m   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
          return prisma.transaction.aggregate({
            where: { userId: user.sub, createdAt: { gte: m, lt: end } },
            _sum: { amount: true }, _count: true,
          }).catch(() => ({ _sum: { amount: null }, _count: 0 }))
            .then(r => ({
              label:  m.toLocaleDateString('en-UG', { month: 'short' }),
              amount: r._sum.amount ?? 0,
              count:  r._count,
            }));
        })
      ),
      prisma.transaction.aggregate({
        where: { userId: user.sub, createdAt: { gte: startOfWeek } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: null } })),
      prisma.transaction.aggregate({
        where: { userId: user.sub, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: null } })),
    ]);

    return {
      user, profile, transactions, monthlyData,
      weeklyEarnings:  weeklyEarnings._sum.amount  ?? 0,
      monthlyEarnings: monthlyEarnings._sum.amount ?? 0,
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    console.error('[collector/earnings] error:', err);
    return {
      user, profile: null, transactions: [], monthlyData: [],
      weeklyEarnings: 0, monthlyEarnings: 0,
    };
  }
};

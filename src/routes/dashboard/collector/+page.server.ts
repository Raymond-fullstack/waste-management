import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'COLLECTOR') throw redirect(303, '/auth/login');
  try {
    const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub }, include: { zone: { select: { name: true } } } });
    if (!profile) throw redirect(303, '/auth/login');
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
    const [availablePickups, myAssignments, recentTransactions, notifCount, availableCount, activeCount, monthlyEarnings] = await Promise.all([
      prisma.pickupRequest.findMany({ where: { status: 'PENDING', assignment: null }, take: 10, orderBy: { createdAt: 'desc' }, include: { category: true, household: { select: { name: true, phone: true } } } }),
      prisma.pickupAssignment.findMany({ where: { collectorId: profile.id }, take: 5, orderBy: { assignedAt: 'desc' }, include: { pickup: { include: { category: true, household: { select: { name: true } } } } } }),
      prisma.transaction.findMany({ where: { userId: user.sub }, take: 5, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.notification.count({ where: { userId: user.sub, isRead: false } }).catch(() => 0),
      prisma.pickupRequest.count({ where: { status: 'PENDING', assignment: null } }),
      prisma.pickupAssignment.count({ where: { collectorId: profile.id, pickup: { status: { in: ['ACCEPTED','EN_ROUTE','COLLECTED'] } } } }),
      prisma.transaction.aggregate({ where: { userId: user.sub, createdAt: { gte: startOfMonth } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: null } })),
    ]);
    return { user, profile, stats: { available: availableCount, active: activeCount, totalDeliveries: profile.totalDeliveries, totalEarnings: profile.totalEarnings, monthlyEarnings: monthlyEarnings._sum.amount ?? 0, rating: profile.rating }, availablePickups, myAssignments, recentTransactions, notifCount };
  } catch (err: any) { if (err?.status === 303) throw err; console.error(err); return { user, profile: null, stats: { available: 0, active: 0, totalDeliveries: 0, totalEarnings: 0, monthlyEarnings: 0, rating: 0 }, availablePickups: [], myAssignments: [], recentTransactions: [], notifCount: 0 }; }
};

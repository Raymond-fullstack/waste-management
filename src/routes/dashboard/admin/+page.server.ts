import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  try {
    const [totalHouseholds, totalCollectors, totalRecyclers, activeCollectors, pendingCollectors, pendingRequests, totalPickups, pendingPickups, completedPickups, todayPickups, weightAgg, landfillRaw, recentPickups, pendingCollectorRequests, wasteBreakdown] = await Promise.all([
      safe(() => prisma.user.count({ where: { role: 'HOUSEHOLD' } }), 0),
      safe(() => prisma.user.count({ where: { role: 'COLLECTOR' } }), 0),
      safe(() => prisma.user.count({ where: { role: 'RECYCLER'  } }), 0),
      safe(() => prisma.collectorProfile.count({ where: { status: 'ACTIVE' } }), 0),
      safe(() => prisma.collectorProfile.count({ where: { status: 'PENDING_VERIFICATION' } }), 0),
      safe(() => prisma.collectorRequest.count({ where: { status: 'PENDING' } }), 0),
      safe(() => prisma.pickupRequest.count(), 0),
      safe(() => prisma.pickupRequest.count({ where: { status: 'PENDING' } }), 0),
      safe(() => prisma.pickupRequest.count({ where: { status: 'DELIVERED' } }), 0),
      safe(() => prisma.pickupRequest.count({ where: { createdAt: { gte: startOfToday } } }), 0),
      safe(() => prisma.pickupRequest.aggregate({ _sum: { actualWeight: true, estimatedWeight: true }, where: { status: 'DELIVERED' } }), { _sum: { actualWeight: null, estimatedWeight: null } }),
      safe(() => prisma.landfillSite.findFirst({ where: { id: 'kiteezi-main' } }), null),
      safe(() => prisma.pickupRequest.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { household: { select: { name: true } }, category: true, assignment: { include: { collector: { include: { user: { select: { name: true } } } } } } } }), []),
      safe(() => prisma.collectorRequest.findMany({ where: { status: 'PENDING' }, take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } } } }), []),
      safe(() => prisma.pickupRequest.groupBy({ by: ['wasteType'], _count: true, _sum: { estimatedWeight: true }, orderBy: { wasteType: 'asc' } }), []),
    ]);
    const dailyData: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayStart.getDate() + 1);
      const count = await safe(() => prisma.pickupRequest.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }), 0);
      dailyData.push({ date: dayStart.toLocaleDateString('en-UG', { weekday: 'short' }), count });
    }
    const totalWeight = (weightAgg._sum as any).actualWeight ?? (weightAgg._sum as any).estimatedWeight ?? 0;
    const landfill = landfillRaw ? { ...landfillRaw, loadPercent: Math.round((landfillRaw.currentLoad / landfillRaw.maxCapacity) * 100), isAlert: (landfillRaw.currentLoad / landfillRaw.maxCapacity) >= landfillRaw.alertThreshold } : null;
    return { user, stats: { totalHouseholds, totalCollectors, totalRecyclers, activeCollectors, pendingCollectors, pendingRequests, totalPickups, pendingPickups, completedPickups, todayPickups, totalWeight }, landfill, recentPickups, pendingCollectorRequests, wasteBreakdown: wasteBreakdown.map((w: any) => ({ type: w.wasteType, count: w._count, weightKg: w._sum?.estimatedWeight ?? 0 })), dailyData };
  } catch (err) {
    console.error('[admin dashboard]', err);
    return { user, stats: { totalHouseholds: 0, totalCollectors: 0, totalRecyclers: 0, activeCollectors: 0, pendingCollectors: 0, pendingRequests: 0, totalPickups: 0, pendingPickups: 0, completedPickups: 0, todayPickups: 0, totalWeight: 0 }, landfill: null, recentPickups: [], pendingCollectorRequests: [], wasteBreakdown: [], dailyData: [] };
  }
};

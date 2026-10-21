import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, serverError, handleAuthError } from '$lib/utils/api';
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const now = new Date(); const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [totalHouseholds, totalCollectors, totalRecyclers, activeCollectors, pendingRequests, totalPickups, pendingPickups, completedPickups, todayPickups, weightAgg, landfill] = await Promise.all([
      prisma.user.count({ where: { role: 'HOUSEHOLD' } }),
      prisma.user.count({ where: { role: 'COLLECTOR' } }),
      prisma.user.count({ where: { role: 'RECYCLER' } }),
      prisma.collectorProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.collectorRequest.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.pickupRequest.count(),
      prisma.pickupRequest.count({ where: { status: 'PENDING' } }),
      prisma.pickupRequest.count({ where: { status: 'DELIVERED' } }),
      prisma.pickupRequest.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.pickupRequest.aggregate({ _sum: { actualWeight: true, estimatedWeight: true }, where: { status: 'DELIVERED' } }),
      prisma.landfillSite.findFirst({ where: { id: 'kiteezi-main' } }),
    ]);
    const totalWeight = weightAgg._sum.actualWeight ?? weightAgg._sum.estimatedWeight ?? 0;
    return ok({ stats: { totalHouseholds, totalCollectors, totalRecyclers, activeCollectors, pendingRequests, totalPickups, pendingPickups, completedPickups, todayPickups, totalWeight }, landfill: landfill ? { ...landfill, loadPercent: Math.round((landfill.currentLoad/landfill.maxCapacity)*100), isAlert: (landfill.currentLoad/landfill.maxCapacity) >= landfill.alertThreshold } : null });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

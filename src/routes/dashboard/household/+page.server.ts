import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'HOUSEHOLD') throw redirect(303, '/auth/login');
  try {
    const [profile, recentPickups, notifCount] = await Promise.all([
      prisma.householdProfile.findUnique({ where: { userId: user.sub } }).catch(() => null),
      prisma.pickupRequest.findMany({ where: { householdId: user.sub }, take: 5, orderBy: { createdAt: 'desc' }, include: { category: true, assignment: { include: { collector: { include: { user: { select: { name: true, phone: true } } } } } } } }),
      prisma.notification.count({ where: { userId: user.sub, isRead: false } }).catch(() => 0),
    ]);
    const pickupStats = await prisma.pickupRequest.groupBy({ by: ['status'], where: { householdId: user.sub }, _count: true });
    const statsMap = Object.fromEntries(pickupStats.map(s => [s.status, s._count]));
    let existingRequest = null; let showBecomeCollector = true;
    try { existingRequest = await prisma.collectorRequest.findUnique({ where: { userId: user.sub } }); } catch {}
    try { const g = await prisma.systemSetting.findUnique({ where: { key: 'collectors_enabled_global' } }); showBecomeCollector = (g?.value ?? 'true') === 'true' && !existingRequest; } catch {}
    const wasteByType = await prisma.pickupRequest.groupBy({ by: ['wasteType'], where: { householdId: user.sub, status: 'DELIVERED' }, _sum: { actualWeight: true, estimatedWeight: true }, _count: true });
    return { user, profile, recentPickups, wasteByType, notifCount, existingRequest, showBecomeCollector, stats: { total: profile?.totalPickups ?? 0, pending: statsMap.PENDING ?? 0, active: (statsMap.ACCEPTED ?? 0) + (statsMap.EN_ROUTE ?? 0) + (statsMap.COLLECTED ?? 0), completed: statsMap.DELIVERED ?? 0, totalWasteKg: profile?.totalWaste ?? 0 } };
  } catch (err) { console.error('[household dashboard]', err); return { user, profile: null, recentPickups: [], wasteByType: [], notifCount: 0, existingRequest: null, showBecomeCollector: true, stats: { total: 0, pending: 0, active: 0, completed: 0, totalWasteKg: 0 } }; }
};

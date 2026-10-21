import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'RECYCLER') throw redirect(303, '/auth/login');
  try {
    const profile = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw redirect(303, '/auth/login');
    const [availableWaste, myBids, notifCount] = await Promise.all([
      prisma.pickupRequest.findMany({ where: { status: 'COLLECTED', wasteType: { in: profile.wasteTypes as any[] } }, take: 10, orderBy: { collectedAt: 'desc' }, include: { category: true, household: { select: { name: true } }, bids: { where: { recyclerId: profile.id }, select: { id: true, pricePerKg: true, totalOffer: true, status: true } }, assignment: { include: { collector: { include: { user: { select: { name: true, phone: true } } } } } } } }),
      prisma.wasteBid.findMany({ where: { recyclerId: profile.id }, take: 8, orderBy: { createdAt: 'desc' }, include: { pickup: { include: { category: true, household: { select: { name: true } } } } } }),
      prisma.notification.count({ where: { userId: user.sub, isRead: false } }).catch(() => 0),
    ]);
    const bidStats = await prisma.wasteBid.groupBy({ by: ['status'], where: { recyclerId: profile.id }, _count: true });
    const bidMap = Object.fromEntries(bidStats.map((b: any) => [b.status, b._count]));
    return { user, profile, stats: { availableWaste: availableWaste.length, pendingBids: bidMap.PENDING ?? 0, acceptedBids: bidMap.ACCEPTED ?? 0, totalProcessed: profile.totalProcessed }, availableWaste, myBids, notifCount };
  } catch (err: any) { if (err?.status === 303) throw err; console.error(err); return { user, profile: null, stats: { availableWaste: 0, pendingBids: 0, acceptedBids: 0, totalProcessed: 0 }, availableWaste: [], myBids: [], notifCount: 0 }; }
};

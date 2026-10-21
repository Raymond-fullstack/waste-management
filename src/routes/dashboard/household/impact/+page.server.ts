import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'HOUSEHOLD') throw redirect(303, '/auth/login');
  try {
    const [profile, wasteByType] = await Promise.all([
      prisma.householdProfile.findUnique({ where: { userId: user.sub } }).catch(() => null),
      prisma.pickupRequest.groupBy({ by: ['wasteType'], where: { householdId: user.sub, status: 'DELIVERED' }, _sum: { actualWeight: true, estimatedWeight: true }, _count: true }),
    ]);
    const now = new Date();
    const monthlyData = await Promise.all(Array.from({ length: 6 }, (_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
      const end = new Date(m.getFullYear(), m.getMonth()+1, 1);
      return prisma.pickupRequest.aggregate({ where: { householdId: user.sub, createdAt: { gte: m, lt: end } }, _sum: { estimatedWeight: true }, _count: true })
        .then(r => ({ label: m.toLocaleDateString('en-UG', { month: 'short' }), weight: r._sum.estimatedWeight ?? 0, count: r._count }));
    }));
    const totalWeight = wasteByType.reduce((s: number, w: any) => s + (w._sum?.estimatedWeight ?? 0), 0);
    return { user, profile, wasteByType, monthlyData, totalWeight, co2Saved: Math.round(totalWeight*0.5), treesEquiv: Math.floor(totalWeight/20), waterSaved: Math.floor(totalWeight*3.5) };
  } catch (err) { console.error(err); return { user, profile: null, wasteByType: [], monthlyData: [], totalWeight: 0, co2Saved: 0, treesEquiv: 0, waterSaved: 0 }; }
};

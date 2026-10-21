import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  try {
    const landfill = await prisma.landfillSite.findFirst({ where: { id: 'kiteezi-main' } });
    const now = new Date();
    const historicalLoad = Array.from({ length: 12 }, (_, i) => { const m = new Date(now.getFullYear(), now.getMonth()-(11-i), 1); return { label: m.toLocaleDateString('en-UG',{month:'short',year:'2-digit'}), load: Math.round(750000 + i*12000) }; });
    const diversionStats = await prisma.pickupRequest.groupBy({ by: ['wasteType'], where: { status: 'DELIVERED' }, _sum: { actualWeight: true, estimatedWeight: true }, _count: true });
    return { user, landfill, historicalLoad, diversionStats };
  } catch (err) { console.error(err); return { user, landfill: null, historicalLoad: [], diversionStats: [] }; }
};

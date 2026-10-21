// src/routes/dashboard/collector/assignments/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'COLLECTOR') throw redirect(303, '/auth/login');
  const filter = url.searchParams.get('filter') ?? 'ACTIVE';
  const page   = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit  = 15;
  try {
    const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw redirect(303, '/auth/login');

    const statusMap: Record<string, string[]> = {
      ACTIVE:    ['ACCEPTED', 'EN_ROUTE', 'COLLECTED'],
      COMPLETED: ['DELIVERED'],
      ALL:       ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'COLLECTED', 'DELIVERED', 'CANCELLED'],
    };
    const statuses = (statusMap[filter] ?? statusMap.ACTIVE) as any[];

    const [assignments, total] = await Promise.all([
      prisma.pickupAssignment.findMany({
        where: { collectorId: profile.id, pickup: { status: { in: statuses } } },
        skip: (page - 1) * limit, take: limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          pickup: {
            include: {
              category: true,
              household: { select: { name: true, phone: true } },
              rating: true,
              bids: {
                where: { collectorId: profile.id },
                include: { recycler: { include: { user: { select: { name: true, phone: true } } } } },
                orderBy: { pricePerKg: 'desc' },
              },
            },
          },
        },
      }),
      prisma.pickupAssignment.count({
        where: { collectorId: profile.id, pickup: { status: { in: statuses } } },
      }),
    ]);
    return { user, profile, assignments, total, page, limit, filter };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    console.error('[collector/assignments] error:', err);
    return { user, profile: null, assignments: [], total: 0, page: 1, limit, filter };
  }
};

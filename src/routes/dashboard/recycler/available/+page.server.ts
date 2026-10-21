// src/routes/dashboard/recycler/available/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'RECYCLER') throw redirect(303, '/auth/login');
  const typeFilter = url.searchParams.get('type') ?? 'ALL';
  const page  = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const profile = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw redirect(303, '/auth/login');

    const acceptedTypes = profile.wasteTypes as string[];

    // Only COLLECTED pickups — collector has the waste, open for recycler bids
    const where: any = { status: 'COLLECTED' };
    if (typeFilter !== 'ALL') {
      where.wasteType = typeFilter;
    } else {
      where.wasteType = { in: acceptedTypes };
    }

    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { collectedAt: 'desc' },
        include: {
          category: true,
          household: { select: { name: true } },
          assignment: {
            include: {
              collector: { include: { user: { select: { name: true, phone: true } } } },
            },
          },
          bids: {
            where: { recyclerId: profile.id },
            select: { id: true, pricePerKg: true, totalOffer: true, status: true, message: true },
          },
        },
      }),
      prisma.pickupRequest.count({ where }),
    ]);
    return { user, profile, pickups, total, page, limit, typeFilter, acceptedTypes };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err;
    console.error('[recycler/available] error:', err);
    return { user, profile: null, pickups: [], total: 0, page: 1, limit, typeFilter, acceptedTypes: [] };
  }
};

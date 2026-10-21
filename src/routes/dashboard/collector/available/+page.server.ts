// src/routes/dashboard/collector/available/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'COLLECTOR') throw redirect(303, '/auth/login');
  const page  = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } });
    if (!profile || profile.status !== 'ACTIVE') {
      return { user, profile, pickups: [], total: 0, page: 1, limit };
    }
    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({
        where: { status: 'PENDING', assignment: null },
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          household: { select: { name: true, phone: true } },
        },
      }),
      prisma.pickupRequest.count({ where: { status: 'PENDING', assignment: null } }),
    ]);
    return { user, profile, pickups, total, page, limit };
  } catch (err) {
    console.error('[collector/available] error:', err);
    return { user, profile: null, pickups: [], total: 0, page: 1, limit };
  }
};

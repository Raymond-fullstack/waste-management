import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  const statusFilter = ['ACTIVE','SUSPENDED','ALL'].includes(url.searchParams.get('status') ?? '') ? (url.searchParams.get('status') ?? 'ACTIVE') : 'ACTIVE';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const where: any = statusFilter !== 'ALL' ? { status: statusFilter } : { status: { in: ['ACTIVE','SUSPENDED','REJECTED'] } };
    const [collectors, total] = await Promise.all([
      // SECURITY: explicit select — deliberately omits totalEarnings / totalCollected.
      // Collector financial data is private and must never be visible to admins.
      prisma.collectorProfile.findMany({
        where, skip: (page-1)*limit, take: limit,
        orderBy: { user: { createdAt: 'desc' } },
        select: {
          id: true, userId: true, vehicleType: true, vehiclePlate: true,
          licenseNumber: true, status: true, isAvailable: true,
          totalCollected: true, totalDeliveries: true, rating: true, ratingCount: true,
          verifiedAt: true,
          user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
          zone: { select: { name: true, code: true } },
          _count: { select: { assignments: true } },
        },
      }),
      prisma.collectorProfile.count({ where }),
    ]);
    return { user, collectors, total, page, limit, statusFilter };
  } catch (err) { console.error(err); return { user, collectors: [], total: 0, page: 1, limit, statusFilter }; }
};

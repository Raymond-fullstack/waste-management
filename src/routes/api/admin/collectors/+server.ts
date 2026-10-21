import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, serverError, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { skip, take, page } = getPagination(url);
    const statusFilter = url.searchParams.get('status');
    const where: any = statusFilter ? { status: statusFilter } : { status: { in: ['ACTIVE','SUSPENDED','REJECTED'] } };
    const [collectors, total] = await Promise.all([
      // SECURITY: explicit select — deliberately omits totalEarnings / totalCollected.
      // Collector financial data is private and must never be exposed to admins.
      prisma.collectorProfile.findMany({
        where, skip, take,
        orderBy: { user: { createdAt: 'desc' } },
        select: {
          id: true, userId: true, vehicleType: true, vehiclePlate: true,
          licenseNumber: true, status: true, isAvailable: true,
          totalCollected: true, totalDeliveries: true, rating: true, ratingCount: true,
          verifiedAt: true,
          user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
          zone: { select: { name: true } },
          _count: { select: { assignments: true } },
        },
      }),
      prisma.collectorProfile.count({ where }),
    ]);
    return ok(paginatedResponse(collectors, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

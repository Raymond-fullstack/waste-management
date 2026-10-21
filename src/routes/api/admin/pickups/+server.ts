import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, serverError, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { skip, take, page } = getPagination(url);
    const statusFilter = url.searchParams.get('status');
    const wasteTypeFilter = url.searchParams.get('wasteType');
    const where: any = {};
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;
    if (wasteTypeFilter && wasteTypeFilter !== 'ALL') where.wasteType = wasteTypeFilter;
    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { household: { select: { name: true, phone: true } }, category: true, assignment: { include: { collector: { include: { user: { select: { name: true } } } } } } } }),
      prisma.pickupRequest.count({ where }),
    ]);
    return ok(paginatedResponse(pickups, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

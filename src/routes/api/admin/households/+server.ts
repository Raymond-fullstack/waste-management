import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, serverError, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { skip, take, page } = getPagination(url);
    const search = url.searchParams.get('q');
    const zoneId = url.searchParams.get('zone');
    const where: any = { role: 'HOUSEHOLD' };
    if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    if (zoneId && zoneId !== 'ALL') where.householdProfile = { zoneId };
    const [households, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { householdProfile: { include: { zone: { select: { name: true } }, district: { select: { name: true } } } }, _count: { select: { pickupRequests: true } } } }),
      prisma.user.count({ where }),
    ]);
    return ok(paginatedResponse(households, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

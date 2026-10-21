import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';
import { collectorRequestSchema } from '$lib/utils/schemas';
import { ok, created, forbidden, conflict, serverError, zodError, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const { skip, take, page } = getPagination(url);
    const where: any = {};
    if (user.role === 'HOUSEHOLD') where.userId = user.sub;
    else if (user.role !== 'ADMIN') return forbidden();
    const statusFilter = url.searchParams.get('status');
    if (statusFilter) where.status = statusFilter;
    const [requests, total] = await Promise.all([
      prisma.collectorRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true, phone: true } } } }),
      prisma.collectorRequest.count({ where }),
    ]);
    return ok(paginatedResponse(requests, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    if (user.role !== 'HOUSEHOLD') return forbidden('Only household accounts can apply');
    const body = await request.json();
    const result = collectorRequestSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const data = result.data;
    const existing = await prisma.collectorRequest.findUnique({ where: { userId: user.sub } });
    if (existing) {
      if (existing.status === 'PENDING') return conflict('You already have a pending application');
      if (existing.status === 'APPROVED') return conflict('Your application was already approved');
      await prisma.collectorRequest.delete({ where: { userId: user.sub } });
    }
    const req = await prisma.collectorRequest.create({ data: { userId: user.sub, vehicleType: data.vehicleType, vehiclePlate: data.vehiclePlate.toUpperCase(), reason: data.reason ?? null } });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (admins.length > 0) await prisma.notification.createMany({ data: admins.map(a => ({ userId: a.id, type: 'COLLECTOR_REQUEST' as const, title: '🚛 New Collector Application', message: `${user.name} has applied to become a collector.`, data: { requestId: req.id } })) });
    return created({ request: req, message: 'Application submitted. You will be notified once reviewed.' });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

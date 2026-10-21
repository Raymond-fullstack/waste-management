import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole, requireAuth } from '$lib/server/auth';
import { createPickupSchema } from '$lib/utils/schemas';
import { ok, created, forbidden, serverError, zodError, handleAuthError, getPagination, paginatedResponse, badRequest } from '$lib/utils/api';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const { skip, take, page } = getPagination(url);
    const statusFilter = url.searchParams.get('status');
    const where: any = {};
    if (user.role === 'HOUSEHOLD') { where.householdId = user.sub; if (statusFilter) where.status = statusFilter; }
    else if (user.role === 'COLLECTOR') { const p = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } }); const f = url.searchParams.get('filter'); if (f === 'mine') where.assignment = { collectorId: p?.id }; else { where.status = 'PENDING'; where.assignment = null; } }
    else if (user.role === 'RECYCLER') { where.status = 'COLLECTED'; const p = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } }); if (p) where.wasteType = { in: p.wasteTypes as any[] }; }
    else if (statusFilter) where.status = statusFilter;
    const [pickups, total] = await Promise.all([
      prisma.pickupRequest.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { household: { select: { name: true, phone: true } }, category: true, assignment: { include: { collector: { include: { user: { select: { name: true, phone: true } } } } } }, rating: true } }),
      prisma.pickupRequest.count({ where }),
    ]);
    return ok(paginatedResponse(pickups, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireRole(cookies, 'HOUSEHOLD');
    const body = await request.json();
    const result = createPickupSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const data = result.data;
    const category = await prisma.wasteCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) return badRequest('Invalid waste category');
    const estimatedFee = category.baseFee + (category.collectorFeePerKg * data.estimatedWeight);
    const pickup = await prisma.pickupRequest.create({ data: { householdId: user.sub, categoryId: data.categoryId, wasteType: data.wasteType as any, estimatedWeight: data.estimatedWeight, description: data.description ?? null, address: data.address, preferredDate: data.preferredDate ? new Date(data.preferredDate) : null, notes: data.notes ?? null, estimatedFee }, include: { category: true } });
    await prisma.householdProfile.updateMany({ where: { userId: user.sub }, data: { totalPickups: { increment: 1 }, totalWaste: { increment: data.estimatedWeight } } });
    const collectors = await prisma.collectorProfile.findMany({ where: { status: 'ACTIVE', isAvailable: true }, take: 15 });
    if (collectors.length > 0) await prisma.notification.createMany({ data: collectors.map(c => ({ userId: c.userId, type: 'PICKUP_REQUEST' as const, title: 'New Pickup Request', message: `New ${data.wasteType.toLowerCase()} waste pickup at ${data.address}`, data: { pickupId: pickup.id } })) });
    return created(pickup);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed to create pickup', err); }
};

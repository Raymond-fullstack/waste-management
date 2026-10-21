import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole, requireAuth } from '$lib/server/auth';
import { createBidSchema } from '$lib/utils/schemas';
import { ok, created, forbidden, badRequest, conflict, serverError, zodError, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const { skip, take, page } = getPagination(url);
    const where: any = {};
    if (user.role === 'RECYCLER') { const p = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } }); if (!p) return forbidden(); where.recyclerId = p.id; }
    else if (user.role === 'COLLECTOR') { const p = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } }); if (p) where.collectorId = p.id; }
    else if (user.role !== 'ADMIN') return forbidden();
    const statusFilter = url.searchParams.get('status');
    if (statusFilter) where.status = statusFilter;
    const [bids, total] = await Promise.all([
      prisma.wasteBid.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { pickup: { include: { category: true, household: { select: { name: true } } } }, recycler: { include: { user: { select: { name: true, phone: true } } } }, collector: { include: { user: { select: { name: true, phone: true } } } } } }),
      prisma.wasteBid.count({ where }),
    ]);
    return ok(paginatedResponse(bids, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireRole(cookies, 'RECYCLER');
    const body = await request.json();
    const result = createBidSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const { pickupId, pricePerKg, message } = result.data;
    const recyclerProfile = await prisma.recyclerProfile.findUnique({ where: { userId: user.sub } });
    if (!recyclerProfile) return forbidden('Recycler profile not found');
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: pickupId }, include: { assignment: true } });
    if (!pickup) return badRequest('Pickup not found');
    if (pickup.status !== 'COLLECTED') return badRequest('You can only bid on COLLECTED pickups');
    if (!pickup.assignment) return badRequest('No collector assigned');
    const acceptedTypes = recyclerProfile.wasteTypes as string[];
    if (!acceptedTypes.includes(pickup.wasteType)) return badRequest(`Your company does not process ${pickup.wasteType} waste`);
    const existing = await prisma.wasteBid.findUnique({ where: { pickupId_recyclerId: { pickupId, recyclerId: recyclerProfile.id } } });
    if (existing) return conflict('You have already placed a bid on this pickup');
    const weight = pickup.actualWeight ?? pickup.estimatedWeight;
    const totalOffer = pricePerKg * weight;
    const collectorId = pickup.assignment.collectorId;
    const bid = await prisma.wasteBid.create({ data: { pickupId, recyclerId: recyclerProfile.id, collectorId, pricePerKg, totalOffer, message: message ?? null }, include: { pickup: { include: { category: true } }, collector: { include: { user: { select: { name: true } } } } } });
    const collProfile = await prisma.collectorProfile.findUnique({ where: { id: collectorId } });
    if (collProfile) await prisma.notification.create({ data: { userId: collProfile.userId, type: 'BID_RECEIVED', title: '💰 New Recycler Bid', message: `${user.name} bid UGX ${totalOffer.toLocaleString()} for the ${pickup.wasteType} waste (${weight}kg). Review in Assignments.`, data: { bidId: bid.id, pickupId, recyclerId: recyclerProfile.id } } });
    return created(bid);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

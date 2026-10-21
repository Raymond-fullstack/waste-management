import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';
import { updatePickupStatusSchema } from '$lib/utils/schemas';
import { ok, notFound, forbidden, badRequest, serverError, zodError, handleAuthError } from '$lib/utils/api';

export const GET: RequestHandler = async ({ params, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: params.id }, include: { household: { select: { id: true, name: true, phone: true } }, category: true, assignment: { include: { collector: { include: { user: { select: { id: true, name: true, phone: true } } } } } }, bids: { include: { recycler: { include: { user: { select: { name: true } } } } } }, rating: true } });
    if (!pickup) return notFound('Pickup not found');
    if (user.role === 'HOUSEHOLD' && pickup.householdId !== user.sub) return forbidden();
    return ok(pickup);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const body = await request.json();
    const result = updatePickupStatusSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const { status, actualWeight, notes } = result.data;
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: params.id }, include: { assignment: true, category: true } });
    if (!pickup) return notFound('Pickup not found');
    const now = new Date();

    if (user.role === 'COLLECTOR') {
      const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } });
      if (!profile || pickup.assignment?.collectorId !== profile.id) return forbidden('Not your pickup');
      if (status === 'DELIVERED') {
        const acceptedBid = await prisma.wasteBid.findFirst({ where: { pickupId: params.id, collectorId: profile.id, status: 'ACCEPTED' } });
        if (!acceptedBid) return badRequest('Cannot deliver — no recycler bid accepted yet');
      }
      const assignUpd: any = {};
      if (status === 'EN_ROUTE')  assignUpd.enRouteAt  = now;
      if (status === 'COLLECTED') assignUpd.collectedAt = now;
      if (status === 'DELIVERED') assignUpd.deliveredAt = now;
      const weight = actualWeight ?? pickup.estimatedWeight;
      await prisma.$transaction([
        prisma.pickupRequest.update({ where: { id: params.id }, data: { status, actualWeight: actualWeight ?? undefined, collectedAt: status === 'COLLECTED' ? now : undefined, deliveredAt: status === 'DELIVERED' ? now : undefined, notes: notes ?? undefined } }),
        prisma.pickupAssignment.update({ where: { pickupId: params.id }, data: assignUpd }),
        ...(status === 'COLLECTED' ? [
          prisma.collectorProfile.update({ where: { id: profile.id }, data: { totalCollected: { increment: weight }, totalEarnings: { increment: pickup.assignment?.fee ?? 0 } } }),
          prisma.transaction.create({ data: { userId: user.sub, amount: pickup.assignment?.fee ?? 0, type: 'PICKUP_PAYMENT', description: `Collection fee — ${pickup.wasteType} ${weight}kg`, reference: pickup.id } }),
        ] : []),
        ...(status === 'DELIVERED' ? [prisma.collectorProfile.update({ where: { id: profile.id }, data: { totalDeliveries: { increment: 1 } } })] : []),
      ]);
      await prisma.notification.create({ data: { userId: pickup.householdId, type: status === 'COLLECTED' ? 'PICKUP_COLLECTED' : status === 'DELIVERED' ? 'PICKUP_DELIVERED' : 'PICKUP_ACCEPTED', title: status === 'COLLECTED' ? '📦 Waste Collected!' : status === 'DELIVERED' ? '✅ Delivered' : '🚛 En Route', message: status === 'COLLECTED' ? `Your waste has been collected.` : status === 'DELIVERED' ? 'Delivered to recycling facility.' : 'Collector is on the way.', data: { pickupId: pickup.id } } });
    } else if (user.role === 'HOUSEHOLD') {
      if (pickup.householdId !== user.sub) return forbidden();
      if (status !== 'CANCELLED') return badRequest('Households can only cancel');
      if (!['PENDING','ACCEPTED'].includes(pickup.status)) return badRequest('Cannot cancel at this stage');
      await prisma.pickupRequest.update({ where: { id: params.id }, data: { status: 'CANCELLED' } });
    } else if (user.role === 'ADMIN') {
      await prisma.pickupRequest.update({ where: { id: params.id }, data: { status } });
    }
    const updated = await prisma.pickupRequest.findUnique({ where: { id: params.id }, include: { category: true, assignment: true } });
    return ok(updated);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

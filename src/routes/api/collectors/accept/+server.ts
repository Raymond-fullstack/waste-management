import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, badRequest, forbidden, notFound, serverError, handleAuthError } from '$lib/utils/api';
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireRole(cookies, 'COLLECTOR');
    const { pickupId } = await request.json();
    if (!pickupId) return badRequest('pickupId required');
    const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } });
    if (!profile || profile.status !== 'ACTIVE') return forbidden('Account not active');
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: pickupId }, include: { assignment: true, category: true } });
    if (!pickup) return notFound('Pickup not found');
    if (pickup.status !== 'PENDING') return badRequest('Pickup no longer available');
    if (pickup.assignment) return badRequest('Pickup already assigned');
    const fee = (pickup.category?.baseFee ?? 5000) + (pickup.category?.collectorFeePerKg ?? 200) * pickup.estimatedWeight;
    await prisma.$transaction([
      prisma.pickupAssignment.create({ data: { pickupId, collectorId: profile.id, acceptedAt: new Date(), fee } }),
      prisma.pickupRequest.update({ where: { id: pickupId }, data: { status: 'ACCEPTED', scheduledAt: new Date(), estimatedFee: fee } }),
    ]);
    await prisma.notification.create({ data: { userId: pickup.householdId, type: 'PICKUP_ACCEPTED', title: '🚛 Pickup Accepted!', message: `A collector has accepted your pickup. Est. fee: UGX ${fee.toLocaleString()}`, data: { pickupId } } });
    return ok({ message: 'Pickup accepted', fee });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed to accept pickup', err); }
};

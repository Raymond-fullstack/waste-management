import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, forbidden, notFound, badRequest, serverError, handleAuthError } from '$lib/utils/api';
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const user = await requireRole(cookies, 'COLLECTOR');
    const { action } = await request.json();
    if (!['accept','reject'].includes(action)) return badRequest('action must be accept or reject');
    const collProfile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub } });
    if (!collProfile) return forbidden();
    const bid = await prisma.wasteBid.findUnique({ where: { id: params.id }, include: { pickup: { include: { assignment: true } }, recycler: { include: { user: { select: { name: true } } } } } });
    if (!bid) return notFound('Bid not found');
    if (bid.collectorId !== collProfile.id) return forbidden('This bid is not for you');
    if (bid.status !== 'PENDING') return badRequest('Bid already reviewed');
    if (action === 'accept') {
      await prisma.$transaction([
        prisma.wasteBid.update({ where: { id: params.id }, data: { status: 'ACCEPTED' } }),
        prisma.wasteBid.updateMany({ where: { pickupId: bid.pickupId, id: { not: params.id }, status: 'PENDING' }, data: { status: 'REJECTED' } }),
      ]);
      await prisma.notification.create({ data: { userId: bid.recycler.userId, type: 'BID_ACCEPTED', title: '✅ Bid Accepted!', message: `Your bid of UGX ${bid.totalOffer.toLocaleString()} for the ${bid.pickup.wasteType} waste was accepted. Coordinate delivery.`, data: { bidId: bid.id, pickupId: bid.pickupId } } });
      return ok({ message: 'Bid accepted' });
    } else {
      await prisma.wasteBid.update({ where: { id: params.id }, data: { status: 'REJECTED' } });
      await prisma.notification.create({ data: { userId: bid.recycler.userId, type: 'BID_REJECTED', title: '❌ Bid Not Accepted', message: `Your bid for the ${bid.pickup.wasteType} waste was not accepted.`, data: { bidId: bid.id } } });
      return ok({ message: 'Bid rejected' });
    }
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

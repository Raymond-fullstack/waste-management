import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { createRatingSchema } from '$lib/utils/schemas';
import { ok, created, forbidden, badRequest, conflict, notFound, serverError, zodError, handleAuthError } from '$lib/utils/api';
export const POST: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const user = await requireRole(cookies, 'HOUSEHOLD');
    const body = await request.json();
    const result = createRatingSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const { score, comment } = result.data;
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: params.id }, include: { assignment: true, rating: true } });
    if (!pickup) return notFound('Pickup not found');
    if (pickup.householdId !== user.sub) return forbidden();
    if (pickup.status !== 'DELIVERED') return badRequest('Can only rate delivered pickups');
    if (pickup.rating) return conflict('Already rated');
    if (!pickup.assignment) return badRequest('No collector assigned');
    const collProfile = await prisma.collectorProfile.findUnique({ where: { id: pickup.assignment.collectorId } });
    if (!collProfile) return notFound('Collector not found');
    const newRating = (collProfile.rating * collProfile.ratingCount + score) / (collProfile.ratingCount + 1);
    await prisma.$transaction([
      prisma.rating.create({ data: { pickupId: pickup.id, giverId: user.sub, receiverId: collProfile.userId, score, comment: comment ?? null } }),
      prisma.collectorProfile.update({ where: { id: collProfile.id }, data: { rating: newRating, ratingCount: { increment: 1 } } }),
    ]);
    return created({ message: 'Rating submitted' });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

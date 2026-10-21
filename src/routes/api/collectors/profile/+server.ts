import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, notFound, serverError, handleAuthError } from '$lib/utils/api';
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const user = await requireRole(cookies, 'COLLECTOR');
    const profile = await prisma.collectorProfile.findUnique({ where: { userId: user.sub }, include: { zone: true, user: { select: { name: true, email: true, phone: true } } } });
    if (!profile) return notFound('Profile not found');
    return ok(profile);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireRole(cookies, 'COLLECTOR');
    const body = await request.json();
    const updated = await prisma.collectorProfile.update({ where: { userId: user.sub }, data: { ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }), ...(body.latitude !== undefined && { latitude: body.latitude }), ...(body.longitude !== undefined && { longitude: body.longitude }) } });
    return ok(updated);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

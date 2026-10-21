import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, notFound, serverError, handleAuthError } from '$lib/utils/api';
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const body = await request.json();
    const zone = await prisma.zone.findUnique({ where: { id: params.id } });
    if (!zone) return notFound('Zone not found');
    const updated = await prisma.zone.update({ where: { id: params.id }, data: { ...(body.maxCollectors !== undefined && { maxCollectors: Number(body.maxCollectors) }), ...(body.collectorsEnabled !== undefined && { collectorsEnabled: Boolean(body.collectorsEnabled) }), ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }) } });
    return ok(updated);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

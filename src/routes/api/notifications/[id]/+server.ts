import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';
import { ok, forbidden, notFound, serverError, handleAuthError } from '$lib/utils/api';
export const PATCH: RequestHandler = async ({ params, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const notif = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notif) return notFound();
    if (notif.userId !== user.sub) return forbidden();
    await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
    return ok({ message: 'Marked as read' });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};
export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const notif = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notif) return notFound();
    if (notif.userId !== user.sub) return forbidden();
    await prisma.notification.delete({ where: { id: params.id } });
    return ok({ message: 'Deleted' });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

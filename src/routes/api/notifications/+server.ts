import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';
import { ok, serverError, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const { skip, take, page } = getPagination(url);
    const unreadOnly = url.searchParams.get('unread') === 'true';
    const where: any = { userId: user.sub };
    if (unreadOnly) where.isRead = false;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
    return ok(paginatedResponse(notifications, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};
export const PATCH: RequestHandler = async ({ cookies }) => {
  try {
    const user = await requireAuth(cookies);
    await prisma.notification.updateMany({ where: { userId: user.sub, isRead: false }, data: { isRead: true } });
    return ok({ message: 'All marked as read' });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

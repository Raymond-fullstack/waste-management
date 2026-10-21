// src/routes/dashboard/recycler/notifications/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'RECYCLER') throw redirect(303, '/auth/login');
  const page  = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 30;
  try {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.sub },
        skip: (page - 1) * limit, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: user.sub } }),
    ]);
    return { user, notifications, total, page, limit };
  } catch (err) {
    console.error('[recycler/notifications] error:', err);
    return { user, notifications: [], total: 0, page: 1, limit };
  }
};

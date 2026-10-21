// src/routes/dashboard/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(303, '/auth/login');

  try {
    // Check isFirstLogin + grab avatarUrl in the same query
    let avatarUrl: string | null = null;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.sub },
        select: { isFirstLogin: true, avatarUrl: true },
      });
      avatarUrl = dbUser?.avatarUrl ?? null;
      if (dbUser?.isFirstLogin && user.role !== 'ADMIN') {
        throw redirect(303, '/auth/change-password');
      }
    } catch (e: any) {
      // Re-throw redirects, ignore DB errors
      if (e?.status === 303) throw e;
    }

    const notificationCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false },
    }).catch(() => 0);

    let pendingRequests = 0;
    if (user.role === 'ADMIN') {
      pendingRequests = await prisma.collectorRequest.count({
        where: { status: 'PENDING' },
      }).catch(() => 0);
    }

    let showBecomeCollector = true;
    if (user.role === 'HOUSEHOLD') {
      try {
        const [globalSetting, existingRequest] = await Promise.all([
          prisma.systemSetting.findUnique({ where: { key: 'collectors_enabled_global' } }).catch(() => null),
          prisma.collectorRequest.findUnique({ where: { userId: user.sub } }).catch(() => null),
        ]);
        const globalEnabled = (globalSetting?.value ?? 'true') === 'true';
        showBecomeCollector = globalEnabled && !existingRequest;

        if (showBecomeCollector) {
          const profile = await prisma.householdProfile.findUnique({
            where: { userId: user.sub },
            include: { zone: true },
          }).catch(() => null);

          const zone = (profile as any)?.zone;
          if (zone) {
            const activeCount = await prisma.collectorProfile.count({
              where: { zoneId: zone.id, status: 'ACTIVE' },
            }).catch(() => 0);
            if (!zone.collectorsEnabled || activeCount >= zone.maxCollectors) {
              showBecomeCollector = false;
            }
          }
        }
      } catch { /* ignore — show option by default */ }
    }

    return { user, avatarUrl, notificationCount, pendingRequests, showBecomeCollector };
  } catch (e: any) {
    if (e?.status === 303) throw e;
    return { user, avatarUrl: null, notificationCount: 0, pendingRequests: 0, showBecomeCollector: true };
  }
};

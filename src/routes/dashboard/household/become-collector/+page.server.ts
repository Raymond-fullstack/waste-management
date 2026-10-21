// src/routes/dashboard/household/become-collector/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(303, '/auth/login');
  if (user.role !== 'HOUSEHOLD') throw redirect(303, '/dashboard');

  try {
    const [existing, globalSetting, householdProfile] = await Promise.all([
      prisma.collectorRequest.findUnique({ where: { userId: user.sub } }).catch(() => null),
      prisma.systemSetting.findUnique({ where: { key: 'collectors_enabled_global' } }).catch(() => null),
      prisma.householdProfile.findUnique({
        where: { userId: user.sub },
        include: { zone: true },
      }).catch(() => prisma.householdProfile.findUnique({ where: { userId: user.sub } })),
    ]);

    const collectorsEnabledGlobal = (globalSetting?.value ?? 'true') === 'true';

    let zoneStatus = { enabled: true, reason: '', zone: null as any };
    const zone = (householdProfile as any)?.zone;
    if (zone) {
      try {
        const activeCount = await prisma.collectorProfile.count({
          where: { zoneId: zone.id, status: 'ACTIVE' },
        });
        if (!zone.collectorsEnabled) {
          zoneStatus = { enabled: false, reason: `Collector applications in ${zone.name} are currently closed.`, zone };
        } else if (activeCount >= zone.maxCollectors) {
          zoneStatus = { enabled: false, reason: `${zone.name} has reached its maximum of ${zone.maxCollectors} collectors.`, zone };
        } else {
          zoneStatus = { enabled: true, reason: `${zone.name} has ${zone.maxCollectors - activeCount} slot(s) available.`, zone };
        }
      } catch { /* ignore */ }
    }

    return { user, existingRequest: existing, collectorsEnabledGlobal, zoneStatus, householdProfile };
  } catch (err) {
    console.error('[become-collector] error:', err);
    return {
      user, existingRequest: null,
      collectorsEnabledGlobal: true,
      zoneStatus: { enabled: true, reason: '', zone: null },
      householdProfile: null,
    };
  }
};

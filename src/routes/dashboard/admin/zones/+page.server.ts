// src/routes/dashboard/admin/zones/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');

  try {
    // Districts — simple, no relation includes that could fail
    const districts = await prisma.district.findMany({
      orderBy: { name: 'asc' },
    }).catch(() => []);

    // Zones — try with _count first, fall back if tables not migrated
    let zones: any[] = [];
    try {
      zones = await prisma.zone.findMany({
        orderBy: { name: 'asc' },
        include: {
          district: { select: { name: true } },
          _count: { select: { collectorProfiles: true, householdProfiles: true } },
        },
      });
    } catch {
      try {
        const raw = await prisma.zone.findMany({
          orderBy: { name: 'asc' },
          include: { district: { select: { name: true } } },
        });
        zones = raw.map((z: any) => ({
          ...z,
          _count: { collectorProfiles: 0, householdProfiles: 0 },
        }));
      } catch (e2) {
        console.error('[zones] zone query failed:', e2);
      }
    }

    // Global setting
    let collectorsEnabledGlobal = true;
    try {
      const s = await prisma.systemSetting.findUnique({ where: { key: 'collectors_enabled_global' } });
      collectorsEnabledGlobal = (s?.value ?? 'true') === 'true';
    } catch {}

    return { user, districts, zones, collectorsEnabledGlobal };
  } catch (err) {
    console.error('[admin/zones]', err);
    return { user, districts: [], zones: [], collectorsEnabledGlobal: true };
  }
};

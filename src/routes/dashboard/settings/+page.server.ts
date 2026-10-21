// src/routes/dashboard/settings/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) throw redirect(303, '/auth/login');

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true, name: true, email: true, phone: true, avatarUrl: true,
        role: true, createdAt: true,
      },
    });

    let roleDetails: any = null;
    if (user.role === 'HOUSEHOLD') {
      roleDetails = await prisma.householdProfile.findUnique({
        where: { userId: user.sub },
        include: { district: { select: { name: true } }, zone: { select: { name: true } } },
      }).catch(() => null);
    } else if (user.role === 'COLLECTOR') {
      roleDetails = await prisma.collectorProfile.findUnique({
        where: { userId: user.sub },
        include: { zone: { select: { name: true } } },
      }).catch(() => null);
    } else if (user.role === 'RECYCLER') {
      roleDetails = await prisma.recyclerProfile.findUnique({
        where: { userId: user.sub },
      }).catch(() => null);
    }

    return { user, profile: dbUser, roleDetails };
  } catch (err) {
    console.error('[settings] load error:', err);
    return { user, profile: null, roleDetails: null };
  }
};

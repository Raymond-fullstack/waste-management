import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  const search = url.searchParams.get('q') ?? '';
  const zoneId = url.searchParams.get('zone') ?? 'ALL';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 25;
  try {
    const where: any = { role: 'HOUSEHOLD' };
    if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    if (zoneId !== 'ALL') where.householdProfile = { zoneId };
    const [households, total, zones] = await Promise.all([
      prisma.user.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' }, include: { householdProfile: { include: { zone: { select: { name: true } }, district: { select: { name: true } } } }, _count: { select: { pickupRequests: true } } } }),
      prisma.user.count({ where }),
      prisma.zone.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, include: { district: { select: { name: true } } } }).catch(() => []),
    ]);
    return { user, households, total, page, limit, search, zoneId, zones };
  } catch (err) { console.error(err); return { user, households: [], total: 0, page: 1, limit, search, zoneId, zones: [] }; }
};

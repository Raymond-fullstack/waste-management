import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');
  const statusFilter = url.searchParams.get('status') ?? 'PENDING';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = 20;
  try {
    const where: any = {};
    if (statusFilter !== 'ALL') where.status = statusFilter;
    const [requests, total, pendingCount, zones] = await Promise.all([
      prisma.collectorRequest.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }, zone: { select: { name: true, code: true } } } }),
      prisma.collectorRequest.count({ where }),
      prisma.collectorRequest.count({ where: { status: 'PENDING' } }),
      prisma.zone.findMany({ where: { isActive: true, collectorsEnabled: true }, orderBy: { name: 'asc' }, include: { district: { select: { name: true } }, _count: { select: { collectorProfiles: true } } } }).catch(() => []),
    ]);
    return { user, requests, total, page, limit, statusFilter, pendingCount, zones };
  } catch (err) { console.error(err); return { user, requests: [], total: 0, page: 1, limit, statusFilter, pendingCount: 0, zones: [] }; }
};

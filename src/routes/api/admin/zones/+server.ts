import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, created, badRequest, serverError, handleAuthError } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url }) => {
  try {
    const districtId = url.searchParams.get('districtId');
    const where: any = { isActive: true };
    if (districtId) where.districtId = districtId;
    const zones = await prisma.zone.findMany({ where, orderBy: { name: 'asc' }, include: { district: { select: { name: true } }, _count: { select: { collectorProfiles: true, householdProfiles: true } } } });
    return ok(zones);
  } catch (err) { return serverError('Failed', err); }
};
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { name, districtId, maxCollectors } = await request.json();
    if (!name?.trim() || !districtId) return badRequest('Name and district required');
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district) return badRequest('District not found');
    const dA = district.name.replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase();
    const zA = name.trim().replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase();
    let code = `${dA}-${zA}`; let s = 1;
    while (await prisma.zone.findUnique({ where: { code } })) code = `${dA}-${zA}${s++}`;
    const zone = await prisma.zone.create({ data: { name: name.trim(), districtId, code, maxCollectors: maxCollectors ? Number(maxCollectors) : 10 }, include: { district: { select: { name: true } } } });
    return created(zone);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, created, conflict, badRequest, serverError, handleAuthError } from '$lib/utils/api';
export const GET: RequestHandler = async () => {
  try {
    const districts = await prisma.district.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, include: { zones: { where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, maxCollectors: true, collectorsEnabled: true } } } });
    return ok(districts);
  } catch (err) { return serverError('Failed', err); }
};
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { name } = await request.json();
    if (!name?.trim()) return badRequest('Name required');
    const existing = await prisma.district.findUnique({ where: { name: name.trim() } });
    if (existing) return conflict('District already exists');
    const district = await prisma.district.create({ data: { name: name.trim() } });
    return created(district);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

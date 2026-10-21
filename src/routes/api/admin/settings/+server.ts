import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, badRequest, serverError, handleAuthError } from '$lib/utils/api';
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const settings = await prisma.systemSetting.findMany();
    return ok(Object.fromEntries(settings.map(s => [s.key, s.value])));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};
export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { key, value } = await request.json();
    if (!key) return badRequest('key required');
    const setting = await prisma.systemSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
    return ok(setting);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

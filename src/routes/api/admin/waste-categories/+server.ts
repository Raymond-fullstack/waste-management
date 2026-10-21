// src/routes/api/admin/waste-categories/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, serverError, handleAuthError } from '$lib/utils/api';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const categories = await prisma.wasteCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { pickupRequests: true } } },
    });
    return ok(categories);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

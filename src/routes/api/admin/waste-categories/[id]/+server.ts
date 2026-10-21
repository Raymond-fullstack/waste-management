// src/routes/api/admin/waste-categories/[id]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { z } from 'zod';
import { ok, notFound, badRequest, serverError, zodError, handleAuthError } from '$lib/utils/api';

const updateCategorySchema = z.object({
  baseFee: z.number().min(0).optional(),
  collectorFeePerKg: z.number().min(0).optional(),
  recyclerPricePerKg: z.number().min(0).optional(),
  recyclingRate: z.number().min(0).max(100).optional(),
  description: z.string().max(300).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) return zodError(result.error);

    const existing = await prisma.wasteCategory.findUnique({ where: { id: params.id } });
    if (!existing) return notFound('Waste category not found');

    if (Object.keys(result.data).length === 0) return badRequest('No changes provided');

    const updated = await prisma.wasteCategory.update({
      where: { id: params.id },
      data: result.data,
    });

    return ok(updated);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed to update pricing', err); }
};

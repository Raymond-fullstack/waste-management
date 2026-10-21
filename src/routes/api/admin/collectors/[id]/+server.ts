import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, notFound, serverError, handleAuthError } from '$lib/utils/api';
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const admin = await requireRole(cookies, 'ADMIN');
    const { status } = await request.json();
    const profile = await prisma.collectorProfile.findFirst({ where: { userId: params.id } });
    if (!profile) return notFound('Collector not found');
    // SECURITY: explicit select on response — never return totalEarnings / totalCollected to admin
    const updated = await prisma.collectorProfile.update({
      where: { id: profile.id },
      data: { status, ...(status === 'ACTIVE' && { verifiedAt: new Date(), verifiedBy: admin.sub }) },
      select: { id: true, status: true, verifiedAt: true, vehicleType: true, vehiclePlate: true, licenseNumber: true },
    });
    await prisma.notification.create({ data: { userId: params.id!, type: 'COLLECTOR_APPROVED', title: 'Account Status Updated', message: `Your collector account status is now: ${status.toLowerCase()}.`, data: { status } } });
    return ok(updated);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

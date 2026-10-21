import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { z } from 'zod';
import { ok, notFound, badRequest, serverError, zodError, handleAuthError } from '$lib/utils/api';
const approveSchema = z.object({ action: z.literal('approve'), zoneId: z.string().min(1), adminNote: z.string().optional() });
const rejectSchema  = z.object({ action: z.literal('reject'),  adminNote: z.string().min(5) });
async function generateLicense(code: string): Promise<string> {
  for (let i = 0; i < 100; i++) { const n = String(Math.floor(Math.random()*9000)+1000); const lic = `${code}-${n}`; const ex = await prisma.collectorProfile.findUnique({ where: { licenseNumber: lic } }); if (!ex) return lic; }
  return `${code}-${Date.now().toString().slice(-5)}`;
}
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const admin = await requireRole(cookies, 'ADMIN');
    const body = await request.json();
    const collReq = await prisma.collectorRequest.findUnique({ where: { id: params.id }, include: { user: true } });
    if (!collReq) return notFound('Application not found');
    if (collReq.status !== 'PENDING') return badRequest('Already reviewed');
    if (body.action === 'approve') {
      const result = approveSchema.safeParse(body);
      if (!result.success) return zodError(result.error);
      const { zoneId, adminNote } = result.data;
      const zone = await prisma.zone.findUnique({ where: { id: zoneId }, include: { _count: { select: { collectorProfiles: true } } } });
      if (!zone) return badRequest('Zone not found');
      if (!zone.isActive || !zone.collectorsEnabled) return badRequest(`Applications closed for ${zone.name}`);
      if (zone._count.collectorProfiles >= zone.maxCollectors) return badRequest(`${zone.name} is at full capacity`);
      const licenseNumber = await generateLicense(zone.code);
      await prisma.$transaction([
        prisma.user.update({ where: { id: collReq.userId }, data: { role: 'COLLECTOR' } }),
        prisma.collectorProfile.upsert({ where: { userId: collReq.userId }, update: { vehicleType: collReq.vehicleType, vehiclePlate: collReq.vehiclePlate, licenseNumber, zoneId, status: 'ACTIVE', verifiedAt: new Date(), verifiedBy: admin.sub }, create: { userId: collReq.userId, vehicleType: collReq.vehicleType, vehiclePlate: collReq.vehiclePlate, licenseNumber, zoneId, status: 'ACTIVE', verifiedAt: new Date(), verifiedBy: admin.sub } }),
        prisma.collectorRequest.update({ where: { id: params.id }, data: { status: 'APPROVED', licenseNumber, assignedZone: zone.name, adminNote: adminNote ?? null, reviewedBy: admin.sub, reviewedAt: new Date() } }),
        prisma.notification.create({ data: { userId: collReq.userId, type: 'COLLECTOR_APPROVED', title: '🎉 Application Approved!', message: `Your application was approved! License: ${licenseNumber} | Zone: ${zone.name}. Log out and back in to start.`, data: { licenseNumber, zoneName: zone.name, zoneId } } }),
      ]);
      return ok({ message: 'Approved', licenseNumber, zone: zone.name });
    } else if (body.action === 'reject') {
      const result = rejectSchema.safeParse(body);
      if (!result.success) return zodError(result.error);
      await prisma.$transaction([
        prisma.collectorRequest.update({ where: { id: params.id }, data: { status: 'REJECTED', adminNote: result.data.adminNote, reviewedBy: admin.sub, reviewedAt: new Date() } }),
        prisma.notification.create({ data: { userId: collReq.userId, type: 'COLLECTOR_REJECTED', title: '❌ Application Outcome', message: `Not approved: ${result.data.adminNote}. You may reapply after addressing this.`, data: { reason: result.data.adminNote } } }),
      ]);
      return ok({ message: 'Rejected' });
    }
    return badRequest('action must be approve or reject');
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

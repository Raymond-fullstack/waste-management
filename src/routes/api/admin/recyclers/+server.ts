import { type RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { addRecyclerSchema } from '$lib/utils/schemas';
import { created, conflict, serverError, zodError, ok, handleAuthError, getPagination, paginatedResponse } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const { skip, take, page } = getPagination(url);
    const [recyclers, total] = await Promise.all([
      prisma.recyclerProfile.findMany({ skip, take, orderBy: { user: { createdAt: 'desc' } }, include: { user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }, _count: { select: { bids: true } } } }),
      prisma.recyclerProfile.count(),
    ]);
    return ok(paginatedResponse(recyclers, total, page, take));
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const body = await request.json();
    const result = addRecyclerSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const data = result.data;
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return conflict('Email already registered');
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { name: data.name, email: data.email.toLowerCase(), password: hashed, role: Role.RECYCLER, phone: data.phone ?? null, isFirstLogin: true, recyclerProfile: { create: { companyName: data.companyName, businessLicense: data.businessLicense, address: data.address, wasteTypes: data.wasteTypes, capacity: Number(data.capacity) } } } });
    await prisma.notification.create({ data: { userId: user.id, type: 'SYSTEM', title: '🏭 Welcome to WasteLink!', message: 'Your recycler account was created. Please change your password on first login.' } });
    return created({ user: { id: user.id, name: user.name, email: user.email }, tempPassword: data.password, message: `Account created for ${data.companyName}` });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

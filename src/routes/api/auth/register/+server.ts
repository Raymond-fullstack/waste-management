import { type RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '$lib/server/prisma';
import { createToken, setSessionCookie } from '$lib/server/auth';
import { registerHouseholdSchema } from '$lib/utils/schemas';
import { created, badRequest, conflict, serverError, zodError } from '$lib/utils/api';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    if (body.role && body.role !== 'HOUSEHOLD') return badRequest('Only household users can self-register');
    const result = registerHouseholdSchema.safeParse(body);
    if (!result.success) return zodError(result.error);
    const data = result.data;
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) return conflict('Email already registered');
    const hashed = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name, email: data.email.toLowerCase(), password: hashed,
        role: Role.HOUSEHOLD, phone: data.phone,
        householdProfile: { create: { address: data.address, districtId: data.districtId ?? null, zoneId: data.zoneId ?? null } },
      },
    });
    const token = await createToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
    setSessionCookie(cookies, token);
    return created({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, redirectTo: '/dashboard/household', message: 'Welcome to WasteLink!' });
  } catch (err) { return serverError('Registration failed', err); }
};

import { type RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '$lib/server/prisma';
import { createToken, setSessionCookie, requireAuth } from '$lib/server/auth';
import { ok, badRequest, unauthorized, serverError, handleAuthError } from '$lib/utils/api';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) return badRequest('Both passwords required');
    if (newPassword.length < 8) return badRequest('Password must be at least 8 characters');
    if (!/[A-Z]/.test(newPassword)) return badRequest('Must contain an uppercase letter');
    if (!/[0-9]/.test(newPassword)) return badRequest('Must contain a number');
    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) return unauthorized();
    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) return badRequest('Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.sub }, data: { password: hashed, isFirstLogin: false } });
    const token = await createToken({ sub: dbUser.id, email: dbUser.email, role: dbUser.role, name: dbUser.name });
    setSessionCookie(cookies, token);
    return ok({ message: 'Password changed successfully' });
  } catch (err: any) {
    return handleAuthError(err) ?? serverError('Failed to change password', err);
  }
};

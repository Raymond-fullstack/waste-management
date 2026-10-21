import { type RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { prisma } from '$lib/server/prisma';
import { createToken, setSessionCookie } from '$lib/server/auth';
import { ok, badRequest, serverError } from '$lib/utils/api';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return badRequest('Email and password required');
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return badRequest('Invalid email or password');
    if (!user.isActive) return badRequest('Account is suspended');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return badRequest('Invalid email or password');
    const token = await createToken({ sub: user.id, email: user.email, role: user.role, name: user.name });
    setSessionCookie(cookies, token);
    const routes: Record<string,string> = {
      HOUSEHOLD:'/dashboard/household', COLLECTOR:'/dashboard/collector',
      RECYCLER:'/dashboard/recycler', ADMIN:'/dashboard/admin',
    };
    // If first login, redirect to change password
    const redirectTo = user.isFirstLogin ? '/auth/change-password' : (routes[user.role] ?? '/dashboard');
    return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, redirectTo });
  } catch (err) { return serverError('Login failed', err); }
};

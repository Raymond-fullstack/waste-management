// src/routes/api/profile/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';
import { ok, badRequest, serverError, handleAuthError } from '$lib/utils/api';

// 2MB limit for base64 avatar data URLs (encoded size, so real image is smaller)
const MAX_AVATAR_LENGTH = 2 * 1024 * 1024;

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const profile = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true },
    });
    return ok(profile);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const user = await requireAuth(cookies);
    const body = await request.json();
    const data: Record<string, any> = {};

    if (body.name !== undefined) {
      if (!body.name.trim() || body.name.trim().length < 2) return badRequest('Name must be at least 2 characters');
      data.name = body.name.trim();
    }
    if (body.phone !== undefined) {
      data.phone = body.phone?.trim() || null;
    }
    if (body.avatarUrl !== undefined) {
      if (body.avatarUrl && body.avatarUrl.length > MAX_AVATAR_LENGTH) {
        return badRequest('Image too large — please use a smaller photo');
      }
      if (body.avatarUrl && !body.avatarUrl.startsWith('data:image/')) {
        return badRequest('Invalid image format');
      }
      data.avatarUrl = body.avatarUrl || null;
    }

    if (Object.keys(data).length === 0) return badRequest('No changes provided');

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data,
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true },
    });

    return ok(updated);
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed to update profile', err); }
};

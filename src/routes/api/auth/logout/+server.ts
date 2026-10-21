import { type RequestHandler } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth';
import { ok } from '$lib/utils/api';
export const POST: RequestHandler = async ({ cookies }) => {
  clearSessionCookie(cookies);
  return ok({ message: 'Logged out' });
};

import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { ok, notFound, serverError } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url }) => {
  try {
    const typeParam = url.searchParams.get('type');
    if (typeParam) {
      const cat = await prisma.wasteCategory.findUnique({ where: { type: typeParam as any } });
      if (!cat) return notFound('Category not found');
      return ok(cat);
    }
    const categories = await prisma.wasteCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return ok(categories);
  } catch (err) { return serverError('Failed to fetch categories', err); }
};

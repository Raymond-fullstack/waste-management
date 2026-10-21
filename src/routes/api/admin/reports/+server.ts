import { type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { ok, serverError, handleAuthError } from '$lib/utils/api';
export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    await requireRole(cookies, 'ADMIN');
    const period = url.searchParams.get('period') ?? 'monthly';
    const now = new Date(); const ranges: { label: string; start: Date; end: Date }[] = [];
    if (period === 'daily') { for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate()-i); const s = new Date(d.getFullYear(),d.getMonth(),d.getDate()); const e = new Date(s); e.setDate(s.getDate()+1); ranges.push({ label: s.toLocaleDateString('en-UG',{weekday:'short',day:'numeric',month:'short'}), start: s, end: e }); } }
    else if (period === 'weekly') { for (let i = 3; i >= 0; i--) { const ws = new Date(now); ws.setDate(now.getDate()-now.getDay()-i*7); ws.setHours(0,0,0,0); const we = new Date(ws); we.setDate(ws.getDate()+7); ranges.push({ label: `W${4-i}`, start: ws, end: we }); } }
    else { for (let i = 5; i >= 0; i--) { const m = new Date(now.getFullYear(),now.getMonth()-i,1); const e = new Date(m.getFullYear(),m.getMonth()+1,1); ranges.push({ label: m.toLocaleDateString('en-UG',{month:'short',year:'numeric'}), start: m, end: e }); } }
    const reportData = await Promise.all(ranges.map(async r => {
      const [total, completed, weight] = await Promise.all([
        prisma.pickupRequest.count({ where: { createdAt: { gte: r.start, lt: r.end } } }),
        prisma.pickupRequest.count({ where: { createdAt: { gte: r.start, lt: r.end }, status: 'DELIVERED' } }),
        prisma.pickupRequest.aggregate({ where: { createdAt: { gte: r.start, lt: r.end }, status: 'DELIVERED' }, _sum: { actualWeight: true, estimatedWeight: true } }),
      ]);
      return { label: r.label, pickups: total, completed, completionRate: total > 0 ? Math.round(completed/total*100) : 0, weightKg: weight._sum.actualWeight ?? weight._sum.estimatedWeight ?? 0 };
    }));
    const [allTime, byWasteType] = await Promise.all([
      prisma.pickupRequest.aggregate({ _count: true, _sum: { estimatedWeight: true, actualWeight: true } }),
      prisma.pickupRequest.groupBy({ by: ['wasteType'], _count: true, _sum: { estimatedWeight: true }, where: { status: 'DELIVERED' }, orderBy: { wasteType: 'asc' } }),
    ]);
    return ok({ reportData, period, allTime, byWasteType });
  } catch (err: any) { return handleAuthError(err) ?? serverError('Failed', err); }
};

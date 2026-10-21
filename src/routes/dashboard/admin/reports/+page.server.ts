// src/routes/dashboard/admin/reports/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  if (!user || user.role !== 'ADMIN') throw redirect(303, '/auth/login');

  const period = url.searchParams.get('period') ?? 'monthly';

  try {
    const now = new Date();
    const ranges: { label: string; start: Date; end: Date }[] = [];

    if (period === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const end   = new Date(start); end.setDate(start.getDate() + 1);
        ranges.push({ label: start.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric', month: 'short' }), start, end });
      }
    } else if (period === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const ws = new Date(now); ws.setDate(now.getDate() - now.getDay() - i * 7); ws.setHours(0,0,0,0);
        const we = new Date(ws); we.setDate(ws.getDate() + 7);
        ranges.push({ label: `W${4-i} ${ws.toLocaleDateString('en-UG', { month: 'short' })}`, start: ws, end: we });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const m   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
        ranges.push({ label: m.toLocaleDateString('en-UG', { month: 'short', year: 'numeric' }), start: m, end });
      }
    }

    const reportData = await Promise.all(ranges.map(async r => {
      const [total, completed, weight] = await Promise.all([
        prisma.pickupRequest.count({ where: { createdAt: { gte: r.start, lt: r.end } } }),
        prisma.pickupRequest.count({ where: { createdAt: { gte: r.start, lt: r.end }, status: 'DELIVERED' } }),
        prisma.pickupRequest.aggregate({
          where: { createdAt: { gte: r.start, lt: r.end }, status: 'DELIVERED' },
          _sum: { actualWeight: true, estimatedWeight: true },
        }),
      ]);
      return {
        label:          r.label,
        pickups:        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        weightKg:       weight._sum.actualWeight ?? weight._sum.estimatedWeight ?? 0,
      };
    }));

    const [allTimeCount, allTimeWeight, byWasteTypeRaw] = await Promise.all([
      prisma.pickupRequest.count(),
      prisma.pickupRequest.aggregate({
        _sum: { estimatedWeight: true, actualWeight: true },
      }),
      // Prisma v5 groupBy: _count: true counts all rows per group
      prisma.pickupRequest.groupBy({
        by: ['wasteType'],
        where: { status: 'DELIVERED' },
        _count: true,
        _sum:   { estimatedWeight: true },
        // orderBy on groupBy in Prisma v5 uses the by field, not _count
        orderBy: { wasteType: 'asc' },
      }),
    ]);

    // Normalize so svelte template can use w._count (number) and w._sum
    const byWasteType = byWasteTypeRaw.map((w: any) => ({
      wasteType: w.wasteType,
      _count:    typeof w._count === 'object' ? (w._count._all ?? w._count.wasteType ?? 0) : w._count,
      _sum:      w._sum,
    }));

    return {
      user,
      reportData,
      period,
      allTime: {
        _count: allTimeCount,
        _sum:   allTimeWeight._sum,
      },
      byWasteType,
    };
  } catch (err) {
    console.error('[admin/reports] error:', err);
    return {
      user,
      reportData: [],
      period,
      allTime: { _count: 0, _sum: { estimatedWeight: null, actualWeight: null } },
      byWasteType: [],
    };
  }
};


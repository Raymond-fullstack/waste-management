<!-- src/routes/dashboard/admin/reports/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { BarChart2, TrendingUp } from 'lucide-svelte';
  import { formatWeight, formatCurrency } from '$lib/utils/api';

  export let data;
  $: ({ reportData, period, allTime, byWasteType } = data);

  const periods = [
    { key: 'daily',   label: 'Daily (7 days)' },
    { key: 'weekly',  label: 'Weekly (4 weeks)' },
    { key: 'monthly', label: 'Monthly (6 months)' },
  ];

  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280',
    GLASS:'#06b6d4', PAPER:'#f59e0b', HAZARDOUS:'#ef4444',
    ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };

  function setPeriod(p: string) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('period', p);
    goto(`?${params.toString()}`);
  }

  $: maxPickups = Math.max(...(reportData?.map((r: any) => r.pickups) ?? []), 1);
  $: maxWeight  = Math.max(...(reportData?.map((r: any) => r.weightKg) ?? []), 1);
  $: totalAllTime = allTime?._count ?? 0;
  $: totalWasteDeliveries = (byWasteType ?? []).reduce((s: number, w: any) => s + (w._count ?? 0), 0);
  $: totalWeight  = allTime?._sum?.actualWeight ?? allTime?._sum?.estimatedWeight ?? 0;
</script>

<svelte:head><title>Reports — WasteLink Admin</title></svelte:head>

<div class="reports-page stagger-children">
  <div class="page-top">
    <h2>Reports & Analytics</h2>
    <div class="period-tabs">
      {#each periods as p}
        <button class="ptab" class:active={period === p.key} on:click={() => setPeriod(p.key)}>{p.label}</button>
      {/each}
    </div>
  </div>

  <!-- All-time summary -->
  <div class="summary-row">
    <div class="sc"><div class="sc-icon green"><BarChart2 size={22}/></div><div><span class="sc-val">{totalAllTime.toLocaleString()}</span><span class="sc-lab">Total Pickups</span></div></div>
    <div class="sc"><div class="sc-icon blue"><TrendingUp size={22}/></div><div><span class="sc-val">{formatWeight(totalWeight)}</span><span class="sc-lab">Total Weight</span></div></div>
    <div class="sc"><div class="sc-icon purple"><BarChart2 size={22}/></div><div>
      <span class="sc-val">{reportData?.length > 0 ? Math.round(reportData.reduce((s: number, r: any) => s + r.completionRate, 0) / reportData.length) : 0}%</span>
      <span class="sc-lab">Avg Completion Rate</span>
    </div></div>
  </div>

  <!-- Pickup Trend Chart -->
  <div class="chart-card">
    <h3>Pickup Requests — {periods.find(p => p.key === period)?.label}</h3>
    <div class="bar-chart">
      {#each (reportData ?? []) as r}
        <div class="bc-col">
          <span class="bc-val">{r.pickups}</span>
          <div class="bc-wrap">
            <div class="bc-bar green" style="height:{(r.pickups / maxPickups) * 100}%">
              <span class="bc-tip">{r.pickups} pickups<br/>{r.completionRate}% done<br/>{formatWeight(r.weightKg)}</span>
            </div>
          </div>
          <span class="bc-label">{r.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Weight Diverted Chart -->
  <div class="chart-card">
    <h3>Waste Diverted (kg)</h3>
    <div class="bar-chart">
      {#each (reportData ?? []) as r}
        <div class="bc-col">
          <span class="bc-val">{r.weightKg > 0 ? r.weightKg.toFixed(0) : '0'}</span>
          <div class="bc-wrap">
            <div class="bc-bar purple" style="height:{(r.weightKg / maxWeight) * 100}%"></div>
          </div>
          <span class="bc-label">{r.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Waste Breakdown Table -->
  {#if byWasteType && byWasteType.length > 0}
    <div class="table-card">
      <h3>Delivered Waste by Type</h3>
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Waste Type</th><th>Deliveries</th><th>Weight</th><th>Share</th></tr></thead>
          <tbody>
            {#each byWasteType as w}
              {@const pct = totalWasteDeliveries > 0 ? Math.round((w._count / totalWasteDeliveries) * 100) : 0}
              <tr>
                <td>
                  <div class="wt-cell">
                    <div class="wt-dot" style="background:{wasteColors[w.wasteType]??'#64748b'}"></div>
                    <span>{w.wasteType}</span>
                  </div>
                </td>
                <td class="td-count">{w._count}</td>
                <td>{formatWeight(w._sum?.estimatedWeight ?? 0)}</td>
                <td>
                  <div class="pct-cell">
                    <div class="pct-bar-wrap">
                      <div class="pct-bar" style="width:{pct}%;background:{wasteColors[w.wasteType]??'#64748b'}"></div>
                    </div>
                    <span>{pct}%</span>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<style>
  .page-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .period-tabs { display: flex; gap: .375rem; }
  .ptab { padding: .375rem .75rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .8125rem; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .ptab.active { background: #059669; border-color: #059669; color: white; }

  .summary-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:600px){ .summary-row { grid-template-columns: 1fr; } }
  .sc { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
  .sc-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sc-icon.green  { background: #ecfdf5; color: #059669; }
  .sc-icon.blue   { background: #eff6ff; color: #3b82f6; }
  .sc-icon.purple { background: #f5f3ff; color: #8b5cf6; }
  .sc-val { display: block; font-family: var(--font-display); font-size: 1.375rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; }
  .sc-lab { display: block; font-size: .75rem; color: #64748b; }

  .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .chart-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .bar-chart { display: flex; align-items: flex-end; gap: .5rem; height: 140px; }
  .bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .25rem; height: 100%; }
  .bc-val { font-size: .625rem; font-weight: 700; color: #334155; }
  .bc-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; background: #f8fafc; border-radius: 6px; overflow: visible; position: relative; }
  .bc-bar { width: 100%; border-radius: 6px 6px 0 0; min-height: 3px; transition: height .6s ease; position: relative; }
  .bc-bar.green  { background: linear-gradient(to top,#059669,#34d399); }
  .bc-bar.purple { background: linear-gradient(to top,#8b5cf6,#c4b5fd); }
  .bc-bar:hover .bc-tip { display: block; }
  .bc-tip { display: none; position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; font-size: .6875rem; padding: .35rem .625rem; border-radius: 6px; white-space: nowrap; pointer-events: none; z-index: 10; line-height: 1.5; }
  .bc-label { font-size: .5625rem; color: #94a3b8; font-weight: 500; text-align: center; }

  .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .table-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .wt-cell { display: flex; align-items: center; gap: .5rem; }
  .wt-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .td-count { font-weight: 700; color: #1e293b; }
  .pct-cell { display: flex; align-items: center; gap: .5rem; }
  .pct-bar-wrap { flex: 1; height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden; min-width: 60px; }
  .pct-bar { height: 100%; border-radius: 999px; }
</style>

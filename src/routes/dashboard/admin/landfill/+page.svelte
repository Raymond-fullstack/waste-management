<!-- src/routes/dashboard/admin/landfill/+page.svelte -->
<script lang="ts">
  import { AlertTriangle, TrendingDown } from 'lucide-svelte';
  import { formatWeight } from '$lib/utils/api';

  export let data;
  $: ({ landfill, historicalLoad, diversionStats } = data);

  $: pct     = landfill ? Math.round((landfill.currentLoad / landfill.maxCapacity) * 100) : 0;
  $: isAlert = landfill ? (landfill.currentLoad / landfill.maxCapacity) >= landfill.alertThreshold : false;
  $: maxLoad = Math.max(...(historicalLoad?.map((h: any) => h.load) ?? []), 1);

  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280',
    GLASS:'#06b6d4', PAPER:'#f59e0b', HAZARDOUS:'#ef4444',
    ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };
</script>

<svelte:head><title>Landfill Monitor — WasteLink Admin</title></svelte:head>

<div class="landfill-page stagger-children">
  <h2>Landfill Monitor</h2>

  {#if !landfill}
    <div class="empty-state">
      <AlertTriangle size={48} strokeWidth={1}/>
      <h3>No landfill data</h3>
      <p>Run the seed script to initialize landfill site data.</p>
    </div>
  {:else}
    <!-- Alert Banner -->
    {#if isAlert}
      <div class="alert-banner" class:critical={pct >= 95}>
        <AlertTriangle size={20}/>
        <div>
          <strong>{pct >= 95 ? '🚨 CRITICAL' : '⚠️ WARNING'}: {landfill.name} at {pct}% capacity</strong>
          <span>Increase waste diversion efforts immediately.</span>
        </div>
      </div>
    {/if}

    <!-- Main Capacity Card -->
    <div class="capacity-card" class:alert={isAlert}>
      <div class="cc-header">
        <h3>{landfill.name}</h3>
        <span class="cc-loc">📍 {landfill.location}</span>
      </div>

      <div class="capacity-display">
        <div class="cd-pct" class:red={pct >= 85} class:yellow={pct >= 70 && pct < 85}>
          {pct}%
        </div>
        <div class="cd-detail">
          <span>Current Load: <strong>{formatWeight(landfill.currentLoad)}</strong></span>
          <span>Max Capacity: <strong>{formatWeight(landfill.maxCapacity)}</strong></span>
          <span>Remaining: <strong class:green={!isAlert}>{formatWeight(landfill.maxCapacity - landfill.currentLoad)}</strong></span>
        </div>
      </div>

      <!-- Capacity Bar -->
      <div class="cap-bar-wrap">
        <div class="cap-bar" style="width:{pct}%"
          class:bar-ok={pct < 70}
          class:bar-warn={pct >= 70 && pct < 85}
          class:bar-crit={pct >= 85}></div>
        <div class="threshold-mark" style="left:{Math.round(landfill.alertThreshold * 100)}%">
          <span class="tm-label">{Math.round(landfill.alertThreshold * 100)}% alert</span>
        </div>
      </div>

      <p class="cap-updated">Last updated: {new Date(landfill.lastUpdated).toLocaleDateString('en-UG', { dateStyle: 'medium' })}</p>
    </div>

    <!-- Historical Chart -->
    {#if historicalLoad && historicalLoad.length > 0}
      <div class="chart-card">
        <h3>12-Month Load History (simulated)</h3>
        <div class="bar-chart">
          {#each historicalLoad as h}
            <div class="bc-col">
              <span class="bc-val">{(h.load/1000).toFixed(0)}k</span>
              <div class="bc-wrap">
                <div class="bc-bar" style="height:{(h.load / maxLoad) * 100}%"
                  class:bar-ok={h.load/landfill.maxCapacity < 0.7}
                  class:bar-warn={h.load/landfill.maxCapacity >= 0.7 && h.load/landfill.maxCapacity < 0.85}
                  class:bar-crit={h.load/landfill.maxCapacity >= 0.85}></div>
              </div>
              <span class="bc-label">{h.label}</span>
            </div>
          {/each}
        </div>
        <div class="chart-legend">
          <span class="leg-item ok">● Normal</span>
          <span class="leg-item warn">● Warning (&gt;70%)</span>
          <span class="leg-item crit">● Critical (&gt;85%)</span>
        </div>
      </div>
    {/if}

    <!-- Diversion Stats -->
    {#if diversionStats && diversionStats.length > 0}
      <div class="diversion-card">
        <div class="dc-header">
          <TrendingDown size={18}/>
          <h3>Waste Diverted from Landfill</h3>
        </div>
        <p class="dc-sub">Delivered via WasteLink — keeping these tonnes out of Kiteezi</p>
        <div class="diversion-list">
          {#each diversionStats as w}
            {@const weight = w._sum?.estimatedWeight ?? 0}
            <div class="dv-row">
              <div class="dv-dot" style="background:{wasteColors[w.wasteType]??'#64748b'}"></div>
              <span class="dv-type">{w.wasteType}</span>
              <span class="dv-count">{w._count} deliveries</span>
              <span class="dv-weight">{formatWeight(weight)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .landfill-page h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 1.5rem; letter-spacing: -.03em; }

  .alert-banner { display: flex; align-items: center; gap: .875rem; padding: 1rem 1.25rem; background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: .875rem; margin-bottom: 1.5rem; color: #991b1b; }
  .alert-banner.critical { background: #fee2e2; border-color: #ef4444; border-width: 2px; }
  .alert-banner strong { display: block; font-weight: 700; margin-bottom: .15rem; }
  .alert-banner span   { font-size: .8125rem; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }

  .capacity-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .capacity-card.alert { border-color: #fca5a5; }
  .cc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: .5rem; }
  .cc-header h3 { font-size: 1.0625rem; font-weight: 700; color: #0f172a; margin: 0; }
  .cc-loc { font-size: .8125rem; color: #64748b; }

  .capacity-display { display: flex; align-items: center; gap: 2rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .cd-pct { font-family: var(--font-display); font-size: 3.5rem; font-weight: 900; color: #059669; line-height: 1; letter-spacing: -.05em; }
  .cd-pct.yellow { color: #d97706; }
  .cd-pct.red    { color: #dc2626; }
  .cd-detail { display: flex; flex-direction: column; gap: .375rem; }
  .cd-detail span { font-size: .875rem; color: #475569; }
  .cd-detail strong { color: #1e293b; }
  :global(.green) { color: #059669 !important; }

  .cap-bar-wrap { height: 20px; background: #f1f5f9; border-radius: 999px; overflow: hidden; position: relative; margin-bottom: .625rem; }
  .cap-bar { height: 100%; border-radius: 999px; transition: width .8s ease; }
  .cap-bar.bar-ok   { background: linear-gradient(to right,#059669,#34d399); }
  .cap-bar.bar-warn { background: linear-gradient(to right,#d97706,#fbbf24); }
  .cap-bar.bar-crit { background: linear-gradient(to right,#dc2626,#ef4444); }
  .threshold-mark { position: absolute; top: 0; height: 100%; width: 2px; background: #1e293b; opacity: .4; }
  .tm-label { position: absolute; top: -1.25rem; left: 50%; transform: translateX(-50%); font-size: .5625rem; color: #64748b; white-space: nowrap; }
  .cap-updated { font-size: .75rem; color: #94a3b8; margin: 0; }

  .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .chart-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .bar-chart { display: flex; align-items: flex-end; gap: .375rem; height: 120px; }
  .bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .2rem; height: 100%; }
  .bc-val { font-size: .5rem; font-weight: 700; color: #475569; }
  .bc-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; background: #f8fafc; border-radius: 4px; overflow: hidden; }
  .bc-bar { width: 100%; border-radius: 4px 4px 0 0; transition: height .6s ease; min-height: 2px; }
  .bc-label { font-size: .5rem; color: #94a3b8; }
  .chart-legend { display: flex; gap: 1rem; margin-top: .875rem; flex-wrap: wrap; }
  .leg-item { font-size: .75rem; font-weight: 500; }
  .leg-item.ok   { color: #059669; }
  .leg-item.warn { color: #d97706; }
  .leg-item.crit { color: #dc2626; }

  .diversion-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .dc-header { display: flex; align-items: center; gap: .625rem; color: #059669; margin-bottom: .3rem; }
  .dc-header h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dc-sub { font-size: .8125rem; color: #64748b; margin: 0 0 1.25rem; }
  .diversion-list { display: flex; flex-direction: column; gap: .625rem; }
  .dv-row { display: flex; align-items: center; gap: .75rem; padding: .75rem; background: #f8fafc; border-radius: .75rem; }
  .dv-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dv-type  { flex: 1; font-size: .875rem; font-weight: 600; color: #1e293b; }
  .dv-count { font-size: .75rem; color: #64748b; }
  .dv-weight{ font-size: .875rem; font-weight: 700; color: #059669; white-space: nowrap; }
</style>

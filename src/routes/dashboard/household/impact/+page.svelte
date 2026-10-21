<!-- src/routes/dashboard/household/impact/+page.svelte -->
<script lang="ts">
  import { TrendingUp, Leaf, Droplets, TreePine } from 'lucide-svelte';
  import { formatWeight } from '$lib/utils/api';

  export let data;
  $: ({ wasteByType, monthlyData, totalWeight, co2Saved, treesEquiv, waterSaved } = data);

  const wasteColors: Record<string, string> = {
    ORGANIC: '#84cc16', PLASTIC: '#3b82f6', METAL: '#6b7280',
    GLASS: '#06b6d4', PAPER: '#f59e0b', HAZARDOUS: '#ef4444',
    ELECTRONIC: '#8b5cf6', MIXED: '#64748b',
  };

  $: maxMonthly = Math.max(...monthlyData.map((m: any) => m.weight), 1);
</script>

<svelte:head><title>My Impact — WasteLink</title></svelte:head>

<div class="impact-page stagger-children">
  <h2>My Recycling Impact</h2>
  <p class="sub">Your contribution to a cleaner Kampala</p>

  <!-- Impact Stats -->
  <div class="impact-grid">
    <div class="ic-card green">
      <TrendingUp size={28} strokeWidth={1.5}/>
      <span class="ic-val">{formatWeight(totalWeight)}</span>
      <span class="ic-lab">Total waste diverted</span>
    </div>
    <div class="ic-card blue">
      <Leaf size={28} strokeWidth={1.5}/>
      <span class="ic-val">{co2Saved} kg</span>
      <span class="ic-lab">CO₂ equivalent saved</span>
    </div>
    <div class="ic-card teal">
      <Droplets size={28} strokeWidth={1.5}/>
      <span class="ic-val">{waterSaved} L</span>
      <span class="ic-lab">Water saved</span>
    </div>
    <div class="ic-card amber">
      <TreePine size={28} strokeWidth={1.5}/>
      <span class="ic-val">{treesEquiv}</span>
      <span class="ic-lab">Tree(s) equivalent</span>
    </div>
  </div>

  <!-- Monthly Chart -->
  <div class="chart-card">
    <h3>Monthly Waste Diverted (kg)</h3>
    <div class="bar-chart">
      {#each monthlyData as m}
        <div class="bc-col">
          <span class="bc-val">{m.weight > 0 ? m.weight.toFixed(1) : '—'}</span>
          <div class="bc-wrap">
            <div class="bc-bar" style="height:{(m.weight / maxMonthly) * 100}%"></div>
          </div>
          <span class="bc-label">{m.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Waste Breakdown -->
  {#if wasteByType.length > 0}
    <div class="breakdown-card">
      <h3>Waste Breakdown</h3>
      <div class="breakdown-list">
        {#each wasteByType as w}
          {@const weight = w._sum.estimatedWeight ?? 0}
          {@const pct = totalWeight > 0 ? Math.round(weight / totalWeight * 100) : 0}
          <div class="bk-row">
            <div class="bk-left">
              <div class="bk-dot" style="background:{wasteColors[w.wasteType] ?? '#64748b'}"></div>
              <span class="bk-type">{w.wasteType}</span>
              <span class="bk-count">{w._count} pickup{w._count !== 1 ? 's' : ''}</span>
            </div>
            <div class="bk-bar-wrap">
              <div class="bk-bar" style="width:{pct}%;background:{wasteColors[w.wasteType] ?? '#64748b'}"></div>
            </div>
            <div class="bk-right">
              <span class="bk-weight">{formatWeight(weight)}</span>
              <span class="bk-pct">{pct}%</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-impact">
      <TrendingUp size={40} strokeWidth={1}/>
      <h3>No completed pickups yet</h3>
      <p>Your recycling impact will appear here once pickups are delivered.</p>
      <a href="/dashboard/household/request" class="btn-primary">Request Your First Pickup</a>
    </div>
  {/if}
</div>

<style>
  .impact-page h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem; letter-spacing: -.03em; }
  .sub { font-size: .875rem; color: #64748b; margin: 0 0 1.5rem; }

  .impact-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:900px){ .impact-grid { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:480px){ .impact-grid { grid-template-columns: 1fr; } }

  .ic-card { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 1.5rem 1rem; border-radius: 1rem; text-align: center; }
  .ic-card.green { background: #ecfdf5; color: #059669; }
  .ic-card.blue  { background: #eff6ff; color: #3b82f6; }
  .ic-card.teal  { background: #f0fdfa; color: #0d9488; }
  .ic-card.amber { background: #fffbeb; color: #d97706; }
  .ic-val { font-family: var(--font-display); font-size: 1.375rem; font-weight: 800; letter-spacing: -.03em; }
  .ic-lab { font-size: .75rem; font-weight: 500; opacity: .8; }

  .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .chart-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .bar-chart { display: flex; align-items: flex-end; gap: .5rem; height: 140px; }
  .bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .25rem; height: 100%; }
  .bc-val { font-size: .5625rem; font-weight: 700; color: #334155; }
  .bc-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; background: #f8fafc; border-radius: 6px; overflow: hidden; }
  .bc-bar { width: 100%; background: linear-gradient(to top, #059669, #34d399); border-radius: 6px; min-height: 3px; transition: height .6s ease; }
  .bc-label { font-size: .5625rem; color: #94a3b8; font-weight: 500; }

  .breakdown-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .breakdown-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .breakdown-list { display: flex; flex-direction: column; gap: .75rem; }
  .bk-row { display: flex; align-items: center; gap: .75rem; }
  .bk-left { display: flex; align-items: center; gap: .5rem; width: 160px; flex-shrink: 0; }
  .bk-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .bk-type { font-size: .8125rem; font-weight: 600; color: #475569; }
  .bk-count { font-size: .6875rem; color: #94a3b8; margin-left: auto; }
  .bk-bar-wrap { flex: 1; height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
  .bk-bar { height: 100%; border-radius: 999px; transition: width .6s ease; }
  .bk-right { display: flex; flex-direction: column; align-items: flex-end; width: 70px; flex-shrink: 0; }
  .bk-weight { font-size: .75rem; font-weight: 700; color: #1e293b; }
  .bk-pct    { font-size: .6875rem; color: #94a3b8; }

  .empty-impact { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-impact h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-impact p  { font-size: .875rem; margin: 0; max-width: 320px; line-height: 1.6; }
</style>

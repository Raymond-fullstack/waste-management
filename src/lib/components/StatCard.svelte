<!-- src/lib/components/StatCard.svelte -->
<script lang="ts">
  export let title: string;
  export let value: string | number;
  export let subtitle: string = '';
  export let icon: any = null;
  export let iconColor: string = '#059669';
  export let iconBg: string = '#ecfdf5';
  export let trend: number | null = null;
</script>

<div class="stat-card">
  {#if icon}
    <div class="sc-icon" style="background:{iconBg};color:{iconColor}">
      <svelte:component this={icon} size={22} strokeWidth={1.8}/>
    </div>
  {/if}
  <div class="sc-body">
    <span class="sc-val">{value}</span>
    <span class="sc-title">{title}</span>
    {#if subtitle}<span class="sc-sub">{subtitle}</span>{/if}
    {#if trend !== null}
      <span class="sc-trend" class:up={trend >= 0} class:down={trend < 0}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </span>
    {/if}
  </div>
</div>

<style>
  .stat-card {
    background: white; border: 1px solid #e2e8f0; border-radius: 1rem;
    padding: 1.25rem; display: flex; align-items: center; gap: 1rem;
    transition: transform .2s, box-shadow .2s;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.07); }
  .sc-icon { width: 46px; height: 46px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .sc-body { flex: 1; min-width: 0; }
  .sc-val   { display: block; font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; line-height: 1; margin-bottom: .2rem; }
  .sc-title { display: block; font-size: .8125rem; font-weight: 600; color: #475569; }
  .sc-sub   { display: block; font-size: .6875rem; color: #94a3b8; margin-top: .125rem; }
  .sc-trend { display: inline-block; font-size: .6875rem; font-weight: 700; margin-top: .2rem; padding: .1rem .375rem; border-radius: 999px; }
  .sc-trend.up   { background: #ecfdf5; color: #059669; }
  .sc-trend.down { background: #fee2e2; color: #dc2626; }
</style>

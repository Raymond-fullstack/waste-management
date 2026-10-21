<!-- src/routes/dashboard/collector/available/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Package, Loader2, MapPin, Clock } from 'lucide-svelte';
  import { formatWeight, formatCurrency, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ pickups, total, limit } = data);

  let accepting: string | null = null;
  let errors: Record<string, string> = {};

  async function acceptPickup(id: string) {
    accepting = id;
    errors[id] = '';
    try {
      const res = await fetch('/api/collectors/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupId: id }),
      });
      const result = await res.json();
      if (!res.ok) { errors[id] = result.message ?? 'Failed to accept'; return; }
      await goto('/dashboard/collector/assignments');
    } catch { errors[id] = 'Network error'; }
    finally { accepting = null; }
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>Available Pickups — WasteLink</title></svelte:head>

<div class="available-page stagger-children">
  <div class="page-top">
    <h2>Available Pickups <span class="total">({total})</span></h2>
    <p class="sub">Unassigned pickup requests in your area</p>
  </div>

  {#if pickups.length === 0}
    <div class="empty-state">
      <Package size={48} strokeWidth={1}/>
      <h3>No pickups available</h3>
      <p>New requests will appear here when households schedule pickups.</p>
    </div>
  {:else}
    <div class="list">
      {#each pickups as p}
        {@const fee = p.category ? p.category.baseFee + (p.category.collectorFeePerKg * p.estimatedWeight) : 0}
        <div class="pickup-card">
          <div class="pc-left">
            <div class="pc-type-dot" style="background:{p.category?.color ?? '#64748b'}"></div>
            <div class="pc-info">
              <span class="pc-name">{p.category?.name ?? p.wasteType}</span>
              <div class="pc-meta">
                <span><Package size={12}/> {formatWeight(p.estimatedWeight)}</span>
                <span><MapPin size={12}/> {p.address?.slice(0, 50) ?? ''}...</span>
                <span><Clock size={12}/> {timeAgo(p.createdAt)}</span>
              </div>
              {#if p.description}
                <p class="pc-desc">"{p.description}"</p>
              {/if}
              {#if errors[p.id]}<p class="pc-error">{errors[p.id]}</p>{/if}
            </div>
          </div>
          <div class="pc-right">
            <div class="pc-fee">
              <span class="fee-label">Est. Earnings</span>
              <span class="fee-amount">{formatCurrency(fee)}</span>
            </div>
            <button class="accept-btn" disabled={accepting === p.id} on:click={() => acceptPickup(p.id)}>
              {#if accepting === p.id}<Loader2 size={14} class="spin"/> Accepting...
              {:else}Accept Pickup{/if}
            </button>
          </div>
        </div>
      {/each}
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page-top { margin-bottom: 1.5rem; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .sub { font-size: .875rem; color: #64748b; margin: 0; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; max-width: 300px; line-height: 1.6; }

  .list { display: flex; flex-direction: column; gap: .875rem; }
  .pickup-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; transition: box-shadow .2s; }
  .pickup-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.07); }
  .pc-left { display: flex; align-items: flex-start; gap: .75rem; flex: 1; min-width: 0; }
  .pc-type-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .pc-info { flex: 1; min-width: 0; }
  .pc-name { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; margin-bottom: .375rem; }
  .pc-meta { display: flex; flex-wrap: wrap; gap: .75rem; font-size: .8125rem; color: #64748b; align-items: center; margin-bottom: .375rem; }
  .pc-meta span { display: flex; align-items: center; gap: .25rem; }
  .pc-desc { font-size: .8125rem; color: #94a3b8; font-style: italic; margin: .375rem 0 0; }
  .pc-error { font-size: .75rem; color: #dc2626; margin: .25rem 0 0; }
  .pc-right { display: flex; flex-direction: column; align-items: flex-end; gap: .625rem; flex-shrink: 0; }
  .pc-fee { text-align: right; }
  .fee-label  { display: block; font-size: .6875rem; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .fee-amount { display: block; font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; }
  .accept-btn { display: flex; align-items: center; gap: .375rem; padding: .5rem 1.25rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: .875rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); transition: background .15s; white-space: nowrap; }
  .accept-btn:hover { background: #2563eb; }
  .accept-btn:disabled { opacity: .7; cursor: not-allowed; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

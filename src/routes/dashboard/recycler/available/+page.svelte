<!-- src/routes/dashboard/recycler/available/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Package, DollarSign, Loader2, Truck, Info } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, timeAgo, formatCurrency } from '$lib/utils/api';

  export let data;
  $: ({ pickups, total, typeFilter, acceptedTypes, limit } = data);

  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280',
    GLASS:'#06b6d4', PAPER:'#f59e0b', HAZARDOUS:'#ef4444',
    ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };

  let bidAmounts: Record<string, string> = {};
  let bidMessages: Record<string, string> = {};
  let biddingId: string | null = null;
  let errors: Record<string, string> = {};

  function setFilter(t: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('type', t); p.delete('page');
    goto(`?${p.toString()}`);
  }

  async function placeBid(pickup: any) {
    const price = Number(bidAmounts[pickup.id]);
    if (!price || price <= 0) { errors[pickup.id] = 'Enter a valid price per kg'; return; }
    biddingId = pickup.id;
    errors[pickup.id] = '';
    try {
      const res = await fetch('/api/recyclers/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupId: pickup.id, pricePerKg: price, message: bidMessages[pickup.id] || undefined }),
      });
      const result = await res.json();
      if (!res.ok) { errors[pickup.id] = result.message ?? 'Bid failed'; return; }
      window.location.reload();
    } catch { errors[pickup.id] = 'Network error.'; }
    finally { biddingId = null; }
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>Available Waste — WasteLink</title></svelte:head>

<div class="available-page stagger-children">
  <div class="page-top">
    <div>
      <h2>Available Waste Lots <span class="total">({total})</span></h2>
      <p class="sub">Only waste that has been <strong>collected</strong> by a collector is available for bidding.</p>
    </div>
    <div class="filter-tabs">
      <button class="ftab" class:active={typeFilter === 'ALL'} on:click={() => setFilter('ALL')}>All</button>
      {#each acceptedTypes as t}
        <button class="ftab" class:active={typeFilter === t} on:click={() => setFilter(t)}
          style={typeFilter === t ? `background:${wasteColors[t]??'#64748b'};border-color:${wasteColors[t]??'#64748b'}` : ''}>{t}</button>
      {/each}
    </div>
  </div>

  {#if pickups.length === 0}
    <div class="empty-state">
      <Package size={48} strokeWidth={1}/>
      <h3>No waste lots available</h3>
      <p>Waste appears here once a collector marks a pickup as "Collected". Check back soon.</p>
    </div>
  {:else}
    <div class="lots-list">
      {#each pickups as p}
        {@const myBid = p.bids?.[0]}
        <div class="lot-card" class:has-bid={!!myBid && myBid.status !== 'REJECTED'}>
          <div class="lc-info">
            <div class="lc-dot" style="background:{wasteColors[p.wasteType]??'#64748b'}"></div>
            <div class="lc-details">
              <div class="lc-top">
                <span class="lc-cat">{p.category?.name ?? p.wasteType}</span>
                <StatusBadge status={p.status}/>
              </div>
              <div class="lc-meta">
                <span><Package size={12}/> {formatWeight(p.actualWeight ?? p.estimatedWeight)}</span>
                {#if p.assignment?.collector}
                  <span><Truck size={12}/> Held by: <strong>{p.assignment.collector.user.name}</strong></span>
                {/if}
                <span>{timeAgo(p.collectedAt ?? p.createdAt)}</span>
              </div>
              {#if p.description}<p class="lc-desc">"{p.description}"</p>{/if}
              <div class="context-note"><Info size={11}/> Your bid goes to the collector holding this waste.</div>
            </div>
          </div>

          <div class="lc-bid-area">
            {#if myBid && myBid.status !== 'REJECTED'}
              <div class="my-bid">
                <div class="mb-icon">✓</div>
                <div>
                  <span class="mb-label">Your bid</span>
                  <span class="mb-price">{formatCurrency(myBid.pricePerKg)}/kg</span>
                  <span class="mb-total">{formatCurrency(myBid.totalOffer)}</span>
                </div>
                <span class="mb-status" class:accepted={myBid.status==='ACCEPTED'}>
                  {myBid.status}
                </span>
              </div>
              {#if myBid.status === 'ACCEPTED'}
                <p class="bid-won">🎉 Bid accepted! Coordinate delivery with the collector.</p>
              {/if}
            {:else}
              <div class="bid-form">
                <div class="bf-price-row">
                  <span class="bf-pre">UGX</span>
                  <input type="number" class="bf-input" placeholder="Price/kg" min="100" step="50"
                    bind:value={bidAmounts[p.id]}/>
                  <span class="bf-suf">/kg</span>
                </div>
                {#if bidAmounts[p.id] && Number(bidAmounts[p.id]) > 0}
                  <p class="bf-total">Total: <strong>{formatCurrency(Number(bidAmounts[p.id]) * (p.actualWeight ?? p.estimatedWeight))}</strong></p>
                {/if}
                <input type="text" class="bf-msg" placeholder="Message to collector (optional)" bind:value={bidMessages[p.id]}/>
                {#if errors[p.id]}<p class="bf-err">{errors[p.id]}</p>{/if}
                <button class="bf-btn" disabled={biddingId===p.id || !bidAmounts[p.id] || Number(bidAmounts[p.id])<=0}
                  on:click={() => placeBid(p)}>
                  {#if biddingId===p.id}<Loader2 size={13} class="spin"/> Bidding...
                  {:else}<DollarSign size={13}/> Place Bid{/if}
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}&type={typeFilter}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .sub { font-size: .8125rem; color: #64748b; margin: 0; }
  .filter-tabs { display: flex; gap: .375rem; flex-wrap: wrap; }
  .ftab { padding: .3rem .625rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .75rem; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .ftab.active { color: white; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; max-width: 320px; line-height: 1.6; }
  .lots-list { display: flex; flex-direction: column; gap: .875rem; }
  .lot-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; display: flex; gap: 1.25rem; align-items: flex-start; }
  .lot-card.has-bid { border-color: #a7f3d0; }
  @media(max-width:600px){ .lot-card { flex-direction: column; } }
  .lc-info { display: flex; align-items: flex-start; gap: .75rem; flex: 1; min-width: 0; }
  .lc-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .lc-details { flex: 1; }
  .lc-top { display: flex; align-items: center; gap: .75rem; margin-bottom: .375rem; flex-wrap: wrap; }
  .lc-cat { font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .lc-meta { display: flex; flex-wrap: wrap; gap: .75rem; font-size: .8125rem; color: #64748b; align-items: center; margin-bottom: .375rem; }
  .lc-meta span { display: flex; align-items: center; gap: .25rem; }
  .lc-desc { font-size: .8125rem; color: #94a3b8; font-style: italic; margin: .25rem 0 0; }
  .context-note { display: flex; align-items: center; gap: .3rem; font-size: .6875rem; color: #94a3b8; margin-top: .375rem; }
  .lc-bid-area { width: 220px; flex-shrink: 0; }
  @media(max-width:600px){ .lc-bid-area { width: 100%; } }
  .my-bid { display: flex; align-items: center; gap: .625rem; padding: .75rem; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: .75rem; }
  .mb-icon { width: 28px; height: 28px; background: #059669; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .875rem; flex-shrink: 0; }
  .mb-label  { display: block; font-size: .6875rem; color: #059669; font-weight: 600; }
  .mb-price  { display: block; font-size: .875rem; font-weight: 800; color: #065f46; font-family: var(--font-display); }
  .mb-total  { display: block; font-size: .6875rem; color: #059669; }
  .mb-status { font-size: .6875rem; font-weight: 700; padding: .15rem .4rem; background: #f1f5f9; color: #64748b; border-radius: 999px; white-space: nowrap; }
  .mb-status.accepted { background: #ecfdf5; color: #059669; }
  .bid-won { font-size: .75rem; color: #059669; font-weight: 600; margin: .375rem 0 0; }
  .bid-form { display: flex; flex-direction: column; gap: .5rem; }
  .bf-price-row { display: flex; align-items: center; gap: 0; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .bf-pre, .bf-suf { padding: .5rem .5rem; background: #f8fafc; font-size: .75rem; color: #94a3b8; flex-shrink: 0; }
  .bf-input { flex: 1; border: none; padding: .5rem .375rem; font-size: .875rem; color: #0f172a; font-family: var(--font-body); outline: none; min-width: 0; }
  .bf-total { font-size: .75rem; color: #64748b; margin: 0; }
  .bf-msg { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: .4rem .625rem; font-size: .75rem; color: #475569; font-family: var(--font-body); outline: none; }
  .bf-err { font-size: .75rem; color: #dc2626; margin: 0; }
  .bf-btn { display: flex; align-items: center; justify-content: center; gap: .375rem; padding: .5rem; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-size: .8125rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); transition: background .15s; }
  .bf-btn:hover { background: #7c3aed; }
  .bf-btn:disabled { opacity: .6; cursor: not-allowed; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

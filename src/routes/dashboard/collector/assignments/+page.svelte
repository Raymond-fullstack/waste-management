<!-- src/routes/dashboard/collector/assignments/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Truck, Loader2, CheckCircle, Package } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, formatCurrency, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ assignments, total, filter, limit } = data);

  const filters = [
    { key: 'ACTIVE',    label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'ALL',       label: 'All' },
  ];

  const statusFlow: Record<string, { label: string; next: string } | null> = {
    ACCEPTED:  { label: 'Mark En Route',  next: 'EN_ROUTE'  },
    EN_ROUTE:  { label: 'Mark Collected', next: 'COLLECTED' },
    COLLECTED: { label: 'Mark Delivered', next: 'DELIVERED' },
    DELIVERED: null,
    CANCELLED: null,
  };

  let updating: string | null = null;
  let processingBid: string | null = null;
  let updateError = '';
  let bidError = '';
  let weightInputs: Record<string, string> = {};

  function setFilter(f: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('filter', f); p.delete('page');
    goto(`?${p.toString()}`);
  }

  async function updateStatus(pickupId: string, newStatus: string) {
    updating = pickupId;
    updateError = '';
    const actualWeight = weightInputs[pickupId] ? Number(weightInputs[pickupId]) : undefined;
    try {
      const res = await fetch(`/api/pickups/${pickupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, actualWeight }),
      });
      const result = await res.json();
      if (!res.ok) { updateError = result.message ?? 'Update failed'; return; }
      window.location.reload();
    } catch { updateError = 'Network error.'; }
    finally { updating = null; }
  }

  async function respondBid(bidId: string, action: 'accept' | 'reject') {
    processingBid = bidId;
    bidError = '';
    try {
      const res = await fetch(`/api/recyclers/bids/${bidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!res.ok) { bidError = result.message ?? 'Failed'; return; }
      window.location.reload();
    } catch { bidError = 'Network error.'; }
    finally { processingBid = null; }
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>My Assignments — WasteLink</title></svelte:head>

<div class="assignments-page stagger-children">
  <div class="page-top">
    <h2>My Assignments</h2>
    <div class="filter-tabs">
      {#each filters as f}
        <button class="ftab" class:active={filter === f.key} on:click={() => setFilter(f.key)}>{f.label}</button>
      {/each}
    </div>
  </div>

  {#if updateError}<div class="error-toast">{updateError}</div>{/if}
  {#if bidError}<div class="error-toast">{bidError}</div>{/if}

  {#if assignments.length === 0}
    <div class="empty-state">
      <Truck size={48} strokeWidth={1}/>
      <h3>No {filter === 'ALL' ? '' : filter.toLowerCase()} assignments</h3>
      <p>Accept available pickups to see them here.</p>
    </div>
  {:else}
    <div class="list">
      {#each assignments as a}
        {@const pickup = a.pickup}
        {@const next = statusFlow[pickup.status]}
        <div class="asgn-card">
          <div class="ac-header">
            <div class="ac-info">
              <span class="ac-type">{pickup.category?.name ?? pickup.wasteType}</span>
              <span class="ac-hh">{pickup.household?.name} · {pickup.household?.phone ?? ''}</span>
              <span class="ac-addr">{pickup.address?.slice(0, 60) ?? ''}...</span>
            </div>
            <div class="ac-right">
              <StatusBadge status={pickup.status}/>
              <span class="ac-weight">{formatWeight(pickup.actualWeight ?? pickup.estimatedWeight)}</span>
              <span class="ac-fee">{formatCurrency(a.fee)}</span>
            </div>
          </div>

          <!-- Recycler Bids (when COLLECTED) -->
          {#if pickup.status === 'COLLECTED'}
            <div class="bids-section">
              <h4 class="bids-title">💰 Recycler Bids
                <span class="bids-count">{pickup.bids?.length ?? 0}</span>
              </h4>
              {#if !pickup.bids?.some((b: any) => b.status === 'ACCEPTED')}
                <p class="bids-hint">Review bids. Accept one to allow delivery.</p>
              {:else}
                <p class="bids-ok">✅ Bid accepted — you can now mark as Delivered.</p>
              {/if}
              {#if pickup.bids && pickup.bids.length > 0}
                <div class="bids-list">
                  {#each pickup.bids as bid}
                    <div class="bid-row" class:bid-accepted={bid.status==='ACCEPTED'} class:bid-rejected={bid.status==='REJECTED'}>
                      <div class="bid-info">
                        <span class="bid-company">{bid.recycler?.user?.name}</span>
                        <span class="bid-price">{formatCurrency(bid.pricePerKg)}/kg · Total: <strong>{formatCurrency(bid.totalOffer)}</strong></span>
                        {#if bid.message}<span class="bid-msg">"{bid.message}"</span>{/if}
                      </div>
                      {#if bid.status === 'PENDING'}
                        <button class="bid-accept" disabled={processingBid===bid.id} on:click={() => respondBid(bid.id,'accept')}>
                          {processingBid===bid.id ? '...' : '✓ Accept'}
                        </button>
                        <button class="bid-reject" disabled={processingBid===bid.id} on:click={() => respondBid(bid.id,'reject')}>✗</button>
                      {:else}
                        <span class="bid-badge" class:badge-acc={bid.status==='ACCEPTED'} class:badge-rej={bid.status==='REJECTED'}>
                          {bid.status}
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="no-bids">⏳ Waiting for recyclers to place bids...</p>
              {/if}
            </div>
          {/if}

          <!-- Action Buttons -->
          {#if next}
            <div class="ac-actions">
              {#if pickup.status === 'EN_ROUTE'}
                <div class="weight-input">
                  <input class="input weight-field" type="number" placeholder="Actual weight (kg)" bind:value={weightInputs[pickup.id]} min="0.1" step="0.1"/>
                </div>
              {/if}
              <button class="action-btn" disabled={updating === pickup.id ||
                (pickup.status === 'COLLECTED' && !pickup.bids?.some((b: any) => b.status === 'ACCEPTED'))}
                on:click={() => updateStatus(pickup.id, next.next)}>
                {#if updating === pickup.id}<Loader2 size={14} class="spin"/> Updating...
                {:else}{next.label}{/if}
              </button>
            </div>
          {:else if pickup.status === 'DELIVERED'}
            <div class="ac-completed"><CheckCircle size={14}/> Delivered</div>
          {/if}
        </div>
      {/each}
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}&filter={filter}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: .75rem; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .filter-tabs { display: flex; gap: .375rem; }
  .ftab { padding: .375rem .75rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .8125rem; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .ftab.active { background: #3b82f6; border-color: #3b82f6; color: white; }
  .error-toast { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-bottom: 1rem; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }
  .list { display: flex; flex-direction: column; gap: 1rem; }
  .asgn-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
  .ac-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: .875rem; }
  .ac-type { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .ac-hh   { display: block; font-size: .8125rem; color: #475569; }
  .ac-addr { display: block; font-size: .75rem; color: #94a3b8; }
  .ac-right { display: flex; flex-direction: column; align-items: flex-end; gap: .25rem; flex-shrink: 0; }
  .ac-weight { font-size: .75rem; color: #64748b; }
  .ac-fee    { font-size: .875rem; font-weight: 700; color: #059669; }
  .bids-section { margin-top: 1rem; padding: 1rem; background: #fefce8; border: 1.5px solid #fde047; border-radius: .875rem; }
  .bids-title { display: flex; align-items: center; gap: .5rem; font-size: .875rem; font-weight: 700; color: #92400e; margin: 0 0 .375rem; }
  .bids-count { font-size: .6875rem; background: #fef3c7; color: #92400e; padding: .1rem .4rem; border-radius: 999px; }
  .bids-hint { font-size: .8125rem; color: #a16207; margin: 0 0 .75rem; }
  .bids-ok   { font-size: .8125rem; color: #059669; font-weight: 600; margin: 0 0 .75rem; }
  .bids-list { display: flex; flex-direction: column; gap: .5rem; }
  .bid-row { display: flex; align-items: center; gap: .75rem; padding: .75rem; background: white; border: 1px solid #e2e8f0; border-radius: .625rem; }
  .bid-row.bid-accepted { border-color: #6ee7b7; background: #f0fdf4; }
  .bid-row.bid-rejected { opacity: .55; }
  .bid-info { flex: 1; min-width: 0; }
  .bid-company { display: block; font-size: .875rem; font-weight: 700; color: #1e293b; }
  .bid-price   { display: block; font-size: .75rem; color: #64748b; }
  .bid-msg     { display: block; font-size: .6875rem; color: #94a3b8; font-style: italic; }
  .bid-accept { padding: .3rem .625rem; background: #ecfdf5; color: #059669; border: 1.5px solid #6ee7b7; border-radius: 6px; font-size: .75rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .bid-reject { padding: .3rem .5rem; background: #fee2e2; color: #dc2626; border: 1.5px solid #fca5a5; border-radius: 6px; font-size: .75rem; cursor: pointer; font-family: var(--font-body); }
  .bid-badge  { font-size: .6875rem; font-weight: 700; padding: .2rem .5rem; border-radius: 999px; }
  .badge-acc  { background: #ecfdf5; color: #059669; }
  .badge-rej  { background: #f1f5f9; color: #94a3b8; }
  .no-bids    { font-size: .8125rem; color: #a16207; margin: 0; }
  .ac-actions { display: flex; align-items: center; gap: .75rem; margin-top: .875rem; }
  .weight-input { flex: 1; max-width: 200px; }
  .weight-field { padding: .5rem .75rem; }
  .action-btn { display: flex; align-items: center; gap: .375rem; padding: .5rem 1.25rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: .875rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); transition: background .15s; }
  .action-btn:hover { background: #2563eb; }
  .action-btn:disabled { opacity: .6; cursor: not-allowed; background: #94a3b8; }
  .ac-completed { display: flex; align-items: center; gap: .375rem; padding: .5rem .875rem; background: #f0fdf4; border: 1px solid #6ee7b7; border-radius: .75rem; font-size: .8125rem; color: #059669; font-weight: 600; margin-top: .875rem; width: fit-content; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

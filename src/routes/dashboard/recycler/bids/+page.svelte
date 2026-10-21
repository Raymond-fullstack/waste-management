<!-- src/routes/dashboard/recycler/bids/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { DollarSign } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatCurrency, formatWeight, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ bids, total, statusFilter, statsMap, limit } = data);

  const filters = ['ALL','PENDING','ACCEPTED','REJECTED','WITHDRAWN'];

  function setFilter(s: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('status', s); p.delete('page');
    goto(`?${p.toString()}`);
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>My Bids — WasteLink</title></svelte:head>

<div class="bids-page stagger-children">
  <!-- Stats Row -->
  <div class="stats-mini">
    <div class="sm-item"><span class="sm-val">{statsMap.PENDING ?? 0}</span><span class="sm-lab">Pending</span></div>
    <div class="sm-item accent"><span class="sm-val">{statsMap.ACCEPTED ?? 0}</span><span class="sm-lab">Accepted</span></div>
    <div class="sm-item"       ><span class="sm-val">{statsMap.REJECTED ?? 0}</span><span class="sm-lab">Rejected</span></div>
  </div>

  <div class="page-top">
    <h2>My Bids <span class="total">({total})</span></h2>
    <div class="filter-tabs">
      {#each filters as f}
        <button class="ftab" class:active={statusFilter === f} on:click={() => setFilter(f)}>
          {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
        </button>
      {/each}
    </div>
  </div>

  {#if bids.length === 0}
    <div class="empty-state">
      <DollarSign size={48} strokeWidth={1}/>
      <h3>No bids found</h3>
      <p>{statusFilter === 'ALL' ? 'Browse available waste lots to place your first bid.' : `No ${statusFilter.toLowerCase()} bids.`}</p>
      <a href="/dashboard/recycler/available" class="btn-primary">Browse Waste Lots</a>
    </div>
  {:else}
    <div class="bids-list">
      {#each bids as b}
        <div class="bid-card" class:accepted={b.status==='ACCEPTED'}>
          <div class="bc-header">
            <div class="bc-pickup">
              <span class="bc-type">{b.pickup?.category?.name ?? b.pickup?.wasteType}</span>
              <span class="bc-weight">{formatWeight(b.pickup?.estimatedWeight ?? 0)}</span>
            </div>
            <StatusBadge status={b.status}/>
          </div>
          <div class="bc-details">
            <div class="bcd-item">
              <span class="bcd-label">Bid Price</span>
              <span class="bcd-val price">{formatCurrency(b.pricePerKg)}/kg</span>
            </div>
            <div class="bcd-item">
              <span class="bcd-label">Total Offer</span>
              <span class="bcd-val total">{formatCurrency(b.totalOffer)}</span>
            </div>
            <div class="bcd-item">
              <span class="bcd-label">Collector</span>
              <span class="bcd-val">{b.collector?.user?.name ?? '—'}</span>
            </div>
            <div class="bcd-item">
              <span class="bcd-label">Placed</span>
              <span class="bcd-val">{timeAgo(b.createdAt)}</span>
            </div>
          </div>
          {#if b.message}
            <p class="bc-msg">"{b.message}"</p>
          {/if}
          {#if b.status === 'ACCEPTED'}
            <div class="accepted-note">
              🎉 Bid accepted! Contact the collector to arrange delivery: <strong>{b.collector?.user?.phone ?? 'No phone'}</strong>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}&status={statusFilter}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .stats-mini { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .sm-item { display: flex; flex-direction: column; align-items: center; padding: .875rem 1.5rem; background: white; border: 1px solid #e2e8f0; border-radius: .875rem; min-width: 90px; }
  .sm-item.accent { border-color: #6ee7b7; background: #ecfdf5; }
  .sm-val { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; }
  .sm-lab { font-size: .6875rem; color: #64748b; font-weight: 500; }

  .page-top { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .filter-tabs { display: flex; gap: .375rem; flex-wrap: wrap; }
  .ftab { padding: .3rem .625rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .75rem; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .ftab.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; max-width: 300px; line-height: 1.6; }

  .bids-list { display: flex; flex-direction: column; gap: .875rem; }
  .bid-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
  .bid-card.accepted { border-color: #6ee7b7; }
  .bc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .875rem; }
  .bc-type   { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .bc-weight { display: block; font-size: .75rem; color: #64748b; }
  .bc-details { display: grid; grid-template-columns: repeat(4,1fr); gap: .75rem; padding: .875rem; background: #f8fafc; border-radius: .75rem; margin-bottom: .75rem; }
  @media(max-width:600px){ .bc-details { grid-template-columns: repeat(2,1fr); } }
  .bcd-label { display: block; font-size: .6875rem; color: #94a3b8; font-weight: 500; margin-bottom: .2rem; }
  .bcd-val   { display: block; font-size: .875rem; font-weight: 600; color: #1e293b; }
  .bcd-val.price { color: #8b5cf6; }
  .bcd-val.total { color: #059669; font-family: var(--font-display); font-size: 1rem; font-weight: 800; }
  .bc-msg { font-size: .8125rem; color: #94a3b8; font-style: italic; margin: 0 0 .75rem; }
  .accepted-note { padding: .75rem 1rem; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: .75rem; font-size: .8125rem; color: #065f46; line-height: 1.5; }

  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
</style>

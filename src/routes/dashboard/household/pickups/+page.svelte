<!-- src/routes/dashboard/household/pickups/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Package, Star, Loader2 } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, formatDate, timeAgo, formatCurrency } from '$lib/utils/api';

  export let data;
  $: ({ pickups, total, statusFilter, limit } = data);

  const statuses = ['ALL','PENDING','ACCEPTED','EN_ROUTE','COLLECTED','DELIVERED','CANCELLED'];
  let cancelling: string | null = null;
  let rating: { id: string; score: number; comment: string } | null = null;
  let ratingLoading = false;

  function setFilter(s: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('status', s); p.delete('page');
    goto(`?${p.toString()}`);
  }

  async function cancelPickup(id: string) {
    if (!confirm('Cancel this pickup request?')) return;
    cancelling = id;
    await fetch(`/api/pickups/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'CANCELLED' }) });
    cancelling = null;
    window.location.reload();
  }

  async function submitRating() {
    if (!rating) return;
    ratingLoading = true;
    await fetch(`/api/pickups/${rating.id}/rate`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ score: rating.score, comment: rating.comment }) });
    ratingLoading = false;
    rating = null;
    window.location.reload();
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>My Pickups — WasteLink</title></svelte:head>

<div class="pickups-page stagger-children">
  <div class="page-top">
    <h2>My Pickups <span class="total">({total})</span></h2>
    <div class="filter-tabs">
      {#each statuses as s}
        <button class="ftab" class:active={statusFilter === s} on:click={() => setFilter(s)}>
          {s === 'EN_ROUTE' ? 'En Route' : s.charAt(0) + s.slice(1).toLowerCase()}
        </button>
      {/each}
    </div>
  </div>

  {#if pickups.length === 0}
    <div class="empty-state">
      <Package size={48} strokeWidth={1}/>
      <h3>No pickups found</h3>
      <p>{statusFilter === 'ALL' ? 'Schedule your first pickup to get started.' : `No ${statusFilter.toLowerCase()} pickups.`}</p>
      <a href="/dashboard/household/request" class="btn-primary">Request Pickup</a>
    </div>
  {:else}
    <div class="list">
      {#each pickups as p}
        <div class="pickup-card">
          <div class="pc-header">
            <div class="pc-type">
              <div class="pc-dot" style="background:{p.category?.color ?? '#64748b'}"></div>
              <div>
                <span class="pc-name">{p.category?.name ?? p.wasteType}</span>
                <span class="pc-weight">{formatWeight(p.actualWeight ?? p.estimatedWeight)}</span>
              </div>
            </div>
            <StatusBadge status={p.status}/>
          </div>

          <div class="pc-details">
            <span>📍 {p.address}</span>
            <span>📅 {formatDate(p.createdAt)}</span>
            {#if p.estimatedFee > 0}<span>💰 Est. Fee: {formatCurrency(p.estimatedFee)}</span>{/if}
            {#if p.assignment?.collector}
              <span>🚛 Collector: {p.assignment.collector.user.name} · {p.assignment.collector.user.phone ?? ''}</span>
            {/if}
          </div>

          {#if p.description}
            <p class="pc-desc">"{p.description}"</p>
          {/if}

          <div class="pc-actions">
            {#if p.status === 'DELIVERED' && !p.rating}
              <button class="btn-rate" on:click={() => rating = { id: p.id, score: 5, comment: '' }}>
                <Star size={13}/> Rate Collector
              </button>
            {/if}
            {#if ['PENDING', 'ACCEPTED'].includes(p.status)}
              <button class="btn-cancel" disabled={cancelling === p.id} on:click={() => cancelPickup(p.id)}>
                {cancelling === p.id ? 'Cancelling...' : 'Cancel'}
              </button>
            {/if}
          </div>
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

<!-- Rating Modal -->
{#if rating}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click|self={() => rating = null}>
    <div class="modal-box animate-fade-in-up">
      <h3>⭐ Rate Your Collector</h3>
      <p>How was your pickup experience?</p>
      <div class="stars">
        {#each [1,2,3,4,5] as n}
          <button class="star-btn" class:filled={n <= rating.score} on:click={() => rating && (rating.score = n)}>★</button>
        {/each}
      </div>
      <textarea class="input" rows="2" placeholder="Optional comment..." bind:value={rating.comment}></textarea>
      <div class="modal-actions">
        <button class="btn-primary" on:click={submitRating} disabled={ratingLoading}>
          {ratingLoading ? 'Submitting...' : 'Submit Rating'}
        </button>
        <button class="btn-secondary" on:click={() => rating = null}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .filter-tabs { display: flex; gap: .375rem; flex-wrap: wrap; }
  .ftab { padding: .3rem .625rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .75rem; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .ftab.active { background: #059669; border-color: #059669; color: white; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }

  .list { display: flex; flex-direction: column; gap: .875rem; }
  .pickup-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
  .pc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: .875rem; }
  .pc-type { display: flex; align-items: center; gap: .75rem; }
  .pc-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .pc-name { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .pc-weight { display: block; font-size: .75rem; color: #64748b; }
  .pc-details { display: flex; flex-direction: column; gap: .25rem; font-size: .8125rem; color: #475569; margin-bottom: .625rem; }
  .pc-desc { font-size: .8125rem; color: #94a3b8; font-style: italic; margin: 0 0 .625rem; }
  .pc-actions { display: flex; gap: .5rem; }
  .btn-rate { display: flex; align-items: center; gap: .375rem; padding: .375rem .875rem; background: #fffbeb; color: #92400e; border: 1.5px solid #fcd34d; border-radius: 8px; font-size: .8125rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .btn-cancel { padding: .375rem .875rem; background: #fee2e2; color: #dc2626; border: 1.5px solid #fca5a5; border-radius: 8px; font-size: .8125rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .btn-cancel:disabled { opacity: .6; cursor: not-allowed; }

  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #059669; border-color: #059669; color: white; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
  .modal-box { background: white; border-radius: 1.25rem; padding: 1.75rem; width: 100%; max-width: 380px; }
  .modal-box h3 { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0 0 .375rem; }
  .modal-box > p { font-size: .875rem; color: #64748b; margin: 0 0 1rem; }
  .stars { display: flex; gap: .375rem; margin-bottom: 1rem; }
  .star-btn { font-size: 2rem; background: none; border: none; cursor: pointer; color: #e2e8f0; transition: color .1s; }
  .star-btn.filled { color: #f59e0b; }
  textarea.input { width: 100%; resize: vertical; font-family: var(--font-body); margin-bottom: 1rem; }
  .modal-actions { display: flex; gap: .5rem; }
  .modal-actions .btn-primary, .modal-actions .btn-secondary { flex: 1; justify-content: center; padding: .625rem; }
</style>

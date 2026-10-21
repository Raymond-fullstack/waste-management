<!-- src/routes/dashboard/admin/collectors/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Truck, Star, ShieldCheck, ShieldX, ArrowRight } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatCurrency, formatWeight, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ collectors, total, statusFilter, limit } = data);

  const filters = [
    { key: 'ACTIVE',    label: 'Active'    },
    { key: 'SUSPENDED', label: 'Suspended' },
    { key: 'ALL',       label: 'All'       },
  ];

  let processingId: string | null = null;

  function setFilter(f: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('status', f); p.delete('page');
    goto(`?${p.toString()}`);
  }

  async function updateStatus(userId: string, status: string) {
    processingId = userId;
    try {
      const res = await fetch(`/api/admin/collectors/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) window.location.reload();
    } finally { processingId = null; }
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>Collectors — WasteLink Admin</title></svelte:head>

<div class="collectors-page stagger-children">
  <div class="page-top">
    <div class="pt-left">
      <div class="filter-tabs">
        {#each filters as f}
          <button class="ftab" class:active={statusFilter === f.key} on:click={() => setFilter(f.key)}>{f.label}</button>
        {/each}
      </div>
      <span class="total-label">{total} collector{total !== 1 ? 's' : ''}</span>
    </div>
    <a href="/dashboard/admin/collector-requests" class="pending-link">
      Review Applications <ArrowRight size={13}/>
    </a>
  </div>

  {#if collectors.length === 0}
    <div class="empty-state">
      <Truck size={48} strokeWidth={1}/>
      <h3>No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} collectors</h3>
      <p>Approved collectors will appear here. Review applications to approve new collectors.</p>
      <a href="/dashboard/admin/collector-requests" class="btn-primary" style="font-size:.875rem;padding:.5rem 1.25rem">Review Applications</a>
    </div>
  {:else}
    <div class="collectors-grid">
      {#each collectors as c}
        <div class="collector-card">
          <div class="cc-header">
            <div class="cc-avatar">{c.user?.name?.charAt(0) ?? '?'}</div>
            <div class="cc-info">
              <span class="cc-name">{c.user?.name}</span>
              <span class="cc-email">{c.user?.email}</span>
              <span class="cc-phone">{c.user?.phone ?? '—'}</span>
            </div>
            <StatusBadge status={c.status} size="md"/>
          </div>

          <div class="cc-details">
            <div class="ccd"><Truck size={13}/><span>{c.vehicleType} · <strong>{c.vehiclePlate}</strong></span></div>
            <div class="ccd"><ShieldCheck size={13}/><span>License: <strong>{c.licenseNumber}</strong></span></div>
            <div class="ccd"><span>Zone: <strong>{c.zone?.name ?? '—'}</strong></span></div>
            <div class="ccd"><span>{c._count?.assignments ?? 0} assignments · {formatWeight(c.totalCollected)}</span></div>
            <div class="ccd"><Star size={13} class="star"/><span>{c.rating.toFixed(1)} ★ ({c.ratingCount} reviews)</span></div>
          </div>

          <div class="cc-footer">
            <span class="cf-joined">Joined {timeAgo(c.user?.createdAt)}</span>
            <span class="cf-deliveries">{c.totalDeliveries} deliveries</span>
          </div>

          <div class="cc-actions">
            {#if c.status === 'ACTIVE'}
              <button class="btn-suspend" disabled={processingId === c.user?.id}
                on:click={() => updateStatus(c.user.id, 'SUSPENDED')}>
                <ShieldX size={13}/> Suspend
              </button>
            {:else if c.status === 'SUSPENDED'}
              <button class="btn-reactivate" disabled={processingId === c.user?.id}
                on:click={() => updateStatus(c.user.id, 'ACTIVE')}>
                <ShieldCheck size={13}/> Reactivate
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

<style>
  .page-top { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .pt-left  { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
  .filter-tabs { display: flex; gap: .375rem; }
  .ftab { padding: .375rem .75rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .8125rem; font-weight: 600; color: #64748b; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .ftab.active { background: #059669; border-color: #059669; color: white; }
  .total-label { font-size: .8125rem; color: #94a3b8; font-weight: 500; }
  .pending-link { display: flex; align-items: center; gap: .375rem; font-size: .8125rem; font-weight: 600; color: #f59e0b; text-decoration: none; padding: .4rem .875rem; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; max-width: 320px; line-height: 1.6; }

  .collectors-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 1rem; }
  .collector-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
  .cc-header { display: flex; align-items: flex-start; gap: .875rem; margin-bottom: .875rem; }
  .cc-avatar { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg,#3b82f6,#059669); color: white; font-weight: 700; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-info   { flex: 1; min-width: 0; }
  .cc-name   { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .cc-email  { display: block; font-size: .75rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cc-phone  { display: block; font-size: .75rem; color: #94a3b8; }

  .cc-details { display: flex; flex-direction: column; gap: .375rem; margin-bottom: .875rem; padding: .875rem; background: #f8fafc; border-radius: .625rem; }
  .ccd { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; color: #475569; }
  :global(.ccd .star) { color: #f59e0b; }

  .cc-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: .875rem; padding-top: .75rem; border-top: 1px solid #f1f5f9; }
  .cf-deliveries { font-size: .8125rem; font-weight: 700; color: #475569; }
  .cf-joined { font-size: .75rem; color: #64748b; }

  .cc-actions { display: flex; gap: .5rem; }
  .btn-suspend    { display: flex; align-items: center; gap: .375rem; padding: .4rem .875rem; background: #fff7ed; color: #c2410c; border: 1.5px solid #fdba74; border-radius: 8px; font-size: .8125rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .btn-reactivate { display: flex; align-items: center; gap: .375rem; padding: .4rem .875rem; background: #ecfdf5; color: #059669; border: 1.5px solid #6ee7b7; border-radius: 8px; font-size: .8125rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .btn-suspend:disabled, .btn-reactivate:disabled { opacity: .6; cursor: not-allowed; }

  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #059669; border-color: #059669; color: white; }
</style>

<!-- src/routes/dashboard/admin/pickups/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Trash2 } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, formatDate, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ pickups, total, statusFilter, wasteType, limit } = data);

  const statuses = ['ALL','PENDING','ACCEPTED','EN_ROUTE','COLLECTED','DELIVERED','CANCELLED'];
  const wasteTypes = ['ALL','ORGANIC','PLASTIC','METAL','GLASS','PAPER','HAZARDOUS','ELECTRONIC','MIXED'];
  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280',
    GLASS:'#06b6d4', PAPER:'#f59e0b', HAZARDOUS:'#ef4444',
    ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };

  function setFilter(key: string, val: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set(key, val); p.delete('page');
    goto(`?${p.toString()}`);
  }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>All Pickups — WasteLink Admin</title></svelte:head>

<div class="pickups-page stagger-children">
  <div class="page-top">
    <h2>All Pickups <span class="total">({total})</span></h2>
    <div class="filters">
      <select class="input filter-select" value={statusFilter} on:change={e => setFilter('status', e.currentTarget.value)}>
        {#each statuses as s}<option value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>{/each}
      </select>
      <select class="input filter-select" value={wasteType} on:change={e => setFilter('wasteType', e.currentTarget.value)}>
        {#each wasteTypes as t}<option value={t}>{t === 'ALL' ? 'All Waste Types' : t}</option>{/each}
      </select>
    </div>
  </div>

  {#if pickups.length === 0}
    <div class="empty-state">
      <Trash2 size={48} strokeWidth={1}/>
      <h3>No pickups found</h3>
      <p>Pickup requests will appear here once households submit them.</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Household</th>
            <th>Waste Type</th>
            <th>Weight</th>
            <th>Status</th>
            <th>Collector</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {#each pickups as p}
            <tr>
              <td>
                <span class="td-name">{p.household?.name ?? '—'}</span>
                <span class="td-sub">{p.address?.slice(0,35) ?? ''}...</span>
              </td>
              <td>
                <span class="waste-tag" style="background:color-mix(in srgb,{wasteColors[p.wasteType]??'#64748b'} 12%,white);color:{wasteColors[p.wasteType]??'#64748b'}">
                  {p.wasteType}
                </span>
              </td>
              <td>{formatWeight(p.actualWeight ?? p.estimatedWeight)}</td>
              <td><StatusBadge status={p.status}/></td>
              <td class="td-collector">{p.assignment?.collector?.user?.name ?? '—'}</td>
              <td class="td-date">{timeAgo(p.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}&status={statusFilter}&wasteType={wasteType}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .filters { display: flex; gap: .625rem; flex-wrap: wrap; }
  .filter-select { padding: .4rem .75rem; font-size: .8125rem; min-width: 140px; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }
  .td-name { display: block; font-size: .875rem; font-weight: 600; color: #1e293b; }
  .td-sub  { display: block; font-size: .6875rem; color: #94a3b8; }
  .waste-tag { display: inline-block; padding: .2rem .55rem; border-radius: 999px; font-size: .6875rem; font-weight: 700; }
  .td-collector { font-size: .8125rem; color: #475569; }
  .td-date { font-size: .8125rem; color: #94a3b8; white-space: nowrap; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #059669; border-color: #059669; color: white; }
</style>

<!-- src/routes/dashboard/admin/households/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Users, Search } from 'lucide-svelte';
  import { formatDate, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ households, total, search, zoneId, zones, limit } = data);

  let searchInput = search ?? '';

  function applySearch() {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('q', searchInput); p.delete('page');
    goto(`?${p.toString()}`);
  }

  function setZone(id: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('zone', id); p.delete('page');
    goto(`?${p.toString()}`);
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter') applySearch(); }

  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>Households — WasteLink Admin</title></svelte:head>

<div class="households-page stagger-children">
  <div class="page-top">
    <h2>Households <span class="total">({total})</span></h2>
    <div class="filters">
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="search-wrap" on:keydown={handleKeydown}>
        <Search size={14} class="search-icon"/>
        <input class="input search-input" placeholder="Search by name, email..." bind:value={searchInput}/>
        <button class="search-btn" on:click={applySearch}>Search</button>
      </div>
      <select class="input filter-select" value={zoneId} on:change={e => setZone(e.currentTarget.value)}>
        <option value="ALL">All Zones</option>
        {#each zones as z}<option value={z.id}>{z.district?.name ?? ''} — {z.name}</option>{/each}
      </select>
    </div>
  </div>

  {#if households.length === 0}
    <div class="empty-state">
      <Users size={48} strokeWidth={1}/>
      <h3>No households found</h3>
      <p>{search ? `No results for "${search}"` : 'Registered households will appear here.'}</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Zone</th><th>Pickups</th><th>Joined</th></tr>
        </thead>
        <tbody>
          {#each households as h}
            <tr>
              <td>
                <div class="user-cell">
                  <div class="uc-avatar">{h.name.charAt(0)}</div>
                  <div>
                    <span class="uc-name">{h.name}</span>
                    <span class="uc-phone">{h.phone ?? '—'}</span>
                  </div>
                </div>
              </td>
              <td class="td-email">{h.email}</td>
              <td class="td-zone">{h.householdProfile?.zone?.name ?? '—'}</td>
              <td class="td-count">{h._count?.pickupRequests ?? 0}</td>
              <td class="td-date">{timeAgo(h.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}&q={search}&zone={zoneId}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .page-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .filters { display: flex; gap: .625rem; flex-wrap: wrap; align-items: center; }
  .search-wrap { display: flex; align-items: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  :global(.search-icon) { margin-left: .75rem; color: #94a3b8; flex-shrink: 0; }
  .search-input { border: none; padding: .4rem .5rem; font-size: .8125rem; font-family: var(--font-body); outline: none; min-width: 200px; }
  .search-btn { padding: .4rem .875rem; background: #059669; color: white; border: none; font-size: .8125rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); }
  .filter-select { padding: .4rem .75rem; font-size: .8125rem; min-width: 160px; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }
  .user-cell { display: flex; align-items: center; gap: .625rem; }
  .uc-avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#3b82f6,#059669); color: white; font-weight: 700; font-size: .875rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .uc-name  { display: block; font-size: .875rem; font-weight: 600; color: #1e293b; }
  .uc-phone { display: block; font-size: .6875rem; color: #94a3b8; }
  .td-email { font-size: .8125rem; color: #475569; }
  .td-zone  { font-size: .8125rem; color: #64748b; }
  .td-count { font-weight: 700; color: #059669; text-align: center; }
  .td-date  { font-size: .8125rem; color: #94a3b8; white-space: nowrap; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #059669; border-color: #059669; color: white; }
</style>

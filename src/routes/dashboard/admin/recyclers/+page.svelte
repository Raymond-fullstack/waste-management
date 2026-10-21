<!-- src/routes/dashboard/admin/recyclers/+page.svelte -->
<script lang="ts">
  import { Recycle, Plus } from 'lucide-svelte';
  import { formatDate, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ recyclers, total, limit } = data);
  $: pages = Math.ceil(total / limit);
</script>

<svelte:head><title>Recyclers — WasteLink Admin</title></svelte:head>

<div class="recyclers-page stagger-children">
  <div class="page-top">
    <h2>Recycler Companies <span class="total">({total})</span></h2>
    <a href="/dashboard/admin/add-recycler" class="btn-primary add-btn">
      <Plus size={14}/> Add Recycler
    </a>
  </div>

  {#if recyclers.length === 0}
    <div class="empty-state">
      <Recycle size={48} strokeWidth={1}/>
      <h3>No recyclers yet</h3>
      <p>Add recycling companies to the system so they can bid on collected waste.</p>
      <a href="/dashboard/admin/add-recycler" class="btn-primary">Add First Recycler</a>
    </div>
  {:else}
    <div class="recyclers-grid">
      {#each recyclers as r}
        <div class="recycler-card">
          <div class="rc-header">
            <div class="rc-icon"><Recycle size={20}/></div>
            <div class="rc-info">
              <span class="rc-company">{r.companyName}</span>
              <span class="rc-license">{r.businessLicense}</span>
            </div>
          </div>
          <div class="rc-contact">
            <span>👤 {r.user?.name}</span>
            <span>✉️ {r.user?.email}</span>
            {#if r.user?.phone}<span>📱 {r.user.phone}</span>{/if}
          </div>
          <div class="rc-stats">
            <div class="rst"><span class="rst-val">{r._count?.bids ?? 0}</span><span class="rst-lab">Total Bids</span></div>
            <div class="rst"><span class="rst-val">{(r.wasteTypes as string[]).length}</span><span class="rst-lab">Waste Types</span></div>
            <div class="rst"><span class="rst-val">{r.capacity.toLocaleString()}kg</span><span class="rst-lab">Capacity</span></div>
          </div>
          <div class="rc-types">
            {#each (r.wasteTypes as string[]) as wt}
              <span class="type-chip">{wt}</span>
            {/each}
          </div>
          <div class="rc-footer">
            <span class="rc-joined">Joined {timeAgo(r.user?.createdAt)}</span>
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
  .page-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .total { color: #94a3b8; font-weight: 500; }
  .add-btn { display: flex; align-items: center; gap: .375rem; padding: .5rem 1rem; font-size: .875rem; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; max-width: 300px; line-height: 1.6; }
  .recyclers-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap: 1rem; }
  .recycler-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; }
  .rc-header { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .875rem; }
  .rc-icon { width: 42px; height: 42px; background: #f5f3ff; color: #8b5cf6; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rc-company { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .rc-license { display: block; font-size: .75rem; color: #94a3b8; font-family: monospace; }
  .rc-contact { display: flex; flex-direction: column; gap: .25rem; font-size: .8125rem; color: #475569; margin-bottom: .875rem; padding: .875rem; background: #f8fafc; border-radius: .75rem; }
  .rc-stats { display: flex; gap: 1rem; margin-bottom: .875rem; }
  .rst { flex: 1; text-align: center; }
  .rst-val { display: block; font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; }
  .rst-lab { display: block; font-size: .6875rem; color: #94a3b8; }
  .rc-types { display: flex; flex-wrap: wrap; gap: .375rem; margin-bottom: .875rem; }
  .type-chip { padding: .2rem .5rem; background: #f5f3ff; color: #7c3aed; border-radius: 999px; font-size: .625rem; font-weight: 700; }
  .rc-footer { padding-top: .75rem; border-top: 1px solid #f1f5f9; }
  .rc-joined { font-size: .75rem; color: #94a3b8; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
</style>

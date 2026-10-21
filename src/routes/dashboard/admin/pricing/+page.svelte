<!-- src/routes/dashboard/admin/pricing/+page.svelte -->
<script lang="ts">
  import { DollarSign, Edit2, Loader2, Save, X, Percent, Package, AlertCircle } from 'lucide-svelte';
  import { formatCurrency } from '$lib/utils/api';

  export let data;
  $: categories = data.categories;

  let editingId: string | null = null;
  let editValues: { baseFee: string; collectorFeePerKg: string; recyclerPricePerKg: string; recyclingRate: string } = {
    baseFee: '', collectorFeePerKg: '', recyclerPricePerKg: '', recyclingRate: '',
  };
  let saving = false;
  let error = '';
  let successId: string | null = null;

  function startEdit(cat: any) {
    editingId = cat.id;
    editValues = {
      baseFee: String(cat.baseFee),
      collectorFeePerKg: String(cat.collectorFeePerKg),
      recyclerPricePerKg: String(cat.recyclerPricePerKg),
      recyclingRate: String(cat.recyclingRate),
    };
    error = '';
  }

  function cancelEdit() {
    editingId = null;
    error = '';
  }

  async function saveEdit(id: string) {
    error = '';
    const baseFee = Number(editValues.baseFee);
    const collectorFeePerKg = Number(editValues.collectorFeePerKg);
    const recyclerPricePerKg = Number(editValues.recyclerPricePerKg);
    const recyclingRate = Number(editValues.recyclingRate);

    if (isNaN(baseFee) || baseFee < 0) { error = 'Base fee must be a valid positive number'; return; }
    if (isNaN(collectorFeePerKg) || collectorFeePerKg < 0) { error = 'Collector fee must be valid'; return; }
    if (isNaN(recyclerPricePerKg) || recyclerPricePerKg < 0) { error = 'Recycler price must be valid'; return; }
    if (isNaN(recyclingRate) || recyclingRate < 0 || recyclingRate > 100) { error = 'Recycling rate must be 0-100'; return; }

    saving = true;
    try {
      const res = await fetch(`/api/admin/waste-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseFee, collectorFeePerKg, recyclerPricePerKg, recyclingRate }),
      });
      const result = await res.json();
      if (!res.ok) { error = result.message ?? 'Failed to update'; return; }
      successId = id;
      editingId = null;
      setTimeout(() => successId = null, 2000);
      window.location.reload();
    } catch { error = 'Network error. Please try again.';
    } finally { saving = false; }
  }

  function exampleFee(cat: any, kg = 5) {
    return cat.baseFee + cat.collectorFeePerKg * kg;
  }
</script>

<svelte:head><title>Pricing — WasteLink Admin</title></svelte:head>

<div class="pricing-page stagger-children">
  <div class="page-top">
    <h2>Waste Pricing</h2>
    <p>Set the household pickup fee structure and recycler price suggestions for each waste type.</p>
  </div>

  <div class="info-banner">
    <AlertCircle size={14}/>
    <span>Household fee = <strong>Base Fee + (Collector Fee/kg × estimated weight)</strong>. Changes apply to all new pickup requests immediately.</span>
  </div>

  {#if categories.length === 0}
    <div class="empty-state">
      <Package size={48} strokeWidth={1}/>
      <h3>No waste categories found</h3>
      <p>Run the seed script to populate default categories.</p>
    </div>
  {:else}
    <div class="categories-grid">
      {#each categories as cat}
        <div class="cat-card" class:editing={editingId === cat.id}>
          <div class="cc-header">
            <div class="cc-dot" style="background:{cat.color}"></div>
            <div class="cc-title">
              <span class="cc-name">{cat.name}</span>
              <span class="cc-count">{cat._count?.pickupRequests ?? 0} pickup{cat._count?.pickupRequests !== 1 ? 's' : ''} to date</span>
            </div>
            {#if editingId !== cat.id}
              <button class="edit-btn" on:click={() => startEdit(cat)}><Edit2 size={13}/> Edit</button>
            {/if}
          </div>

          {#if cat.description}<p class="cc-desc">{cat.description}</p>{/if}

          {#if editingId === cat.id}
            {#if error}<div class="edit-error">{error}</div>{/if}
            <div class="edit-form">
              <div class="ef-row">
                <label class="ef-label" for="base-{cat.id}">Base Fee (UGX)</label>
                <input id="base-{cat.id}" type="number" class="ef-input" min="0" step="100" bind:value={editValues.baseFee}/>
              </div>
              <div class="ef-row">
                <label class="ef-label" for="coll-{cat.id}">Collector Fee/kg (UGX)</label>
                <input id="coll-{cat.id}" type="number" class="ef-input" min="0" step="10" bind:value={editValues.collectorFeePerKg}/>
              </div>
              <div class="ef-row">
                <label class="ef-label" for="rec-{cat.id}">Recycler Price/kg (UGX)</label>
                <input id="rec-{cat.id}" type="number" class="ef-input" min="0" step="10" bind:value={editValues.recyclerPricePerKg}/>
              </div>
              <div class="ef-row">
                <label class="ef-label" for="rate-{cat.id}">Recycling Rate (%)</label>
                <input id="rate-{cat.id}" type="number" class="ef-input" min="0" max="100" step="1" bind:value={editValues.recyclingRate}/>
              </div>
              <div class="ef-actions">
                <button class="btn-primary ef-btn" on:click={() => saveEdit(cat.id)} disabled={saving}>
                  {#if saving}<Loader2 size={13} class="spin"/> Saving...{:else}<Save size={13}/> Save{/if}
                </button>
                <button class="btn-secondary ef-btn" on:click={cancelEdit}><X size={13}/> Cancel</button>
              </div>
            </div>
          {:else}
            <div class="pricing-grid">
              <div class="price-item">
                <span class="pi-label">Base Fee</span>
                <span class="pi-val">{formatCurrency(cat.baseFee)}</span>
              </div>
              <div class="price-item">
                <span class="pi-label">Collector/kg</span>
                <span class="pi-val collector">{formatCurrency(cat.collectorFeePerKg)}</span>
              </div>
              <div class="price-item">
                <span class="pi-label">Recycler/kg</span>
                <span class="pi-val recycler">{formatCurrency(cat.recyclerPricePerKg)}</span>
              </div>
              <div class="price-item">
                <span class="pi-label"><Percent size={10}/> Recycling Rate</span>
                <span class="pi-val">{cat.recyclingRate}%</span>
              </div>
            </div>
            <div class="example-row">
              <DollarSign size={12}/>
              <span>Example: 5kg pickup = <strong>{formatCurrency(exampleFee(cat))}</strong></span>
            </div>
          {/if}

          {#if successId === cat.id}
            <div class="success-tag">✓ Updated</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-top { margin-bottom: 1rem; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem; letter-spacing: -.03em; }
  .page-top p  { font-size: .875rem; color: #64748b; margin: 0; }

  .info-banner { display: flex; align-items: flex-start; gap: .5rem; padding: .75rem 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: .75rem; font-size: .8125rem; color: #1e40af; margin-bottom: 1.5rem; line-height: 1.5; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }

  .categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
  .cat-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; position: relative; transition: border-color .15s; }
  .cat-card.editing { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,.08); }

  .cc-header { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .5rem; }
  .cc-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .cc-title { flex: 1; }
  .cc-name  { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; }
  .cc-count { display: block; font-size: .6875rem; color: #94a3b8; }
  .edit-btn { display: flex; align-items: center; gap: .3rem; padding: .3rem .7rem; background: #f1f5f9; color: #475569; border: none; border-radius: 7px; font-size: .75rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); transition: all .15s; flex-shrink: 0; }
  .edit-btn:hover { background: #e2e8f0; color: #1e293b; }
  .cc-desc { font-size: .8125rem; color: #64748b; margin: 0 0 .875rem; }

  .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .625rem; margin-bottom: .875rem; }
  .price-item { padding: .625rem .75rem; background: #f8fafc; border-radius: .625rem; }
  .pi-label { display: flex; align-items: center; gap: .25rem; font-size: .6875rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .03em; margin-bottom: .2rem; }
  .pi-val   { display: block; font-size: .9375rem; font-weight: 800; color: #0f172a; font-family: var(--font-display); }
  .pi-val.collector { color: #3b82f6; }
  .pi-val.recycler   { color: #8b5cf6; }

  .example-row { display: flex; align-items: center; gap: .4rem; font-size: .8125rem; color: #059669; padding-top: .75rem; border-top: 1px solid #f1f5f9; }
  .example-row strong { font-weight: 700; }

  .edit-error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .5rem .75rem; border-radius: 7px; font-size: .75rem; margin-bottom: .75rem; }
  .edit-form { display: flex; flex-direction: column; gap: .625rem; }
  .ef-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
  .ef-label { font-size: .8125rem; color: #475569; font-weight: 600; flex-shrink: 0; }
  .ef-input { width: 130px; padding: .375rem .625rem; border: 1.5px solid #e2e8f0; border-radius: 7px; font-size: .8125rem; font-family: var(--font-body); text-align: right; outline: none; }
  .ef-input:focus { border-color: #059669; }
  .ef-actions { display: flex; gap: .5rem; margin-top: .375rem; }
  .ef-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: .3rem; padding: .5rem; font-size: .8125rem; }
  .ef-btn:disabled { opacity: .7; cursor: not-allowed; }

  .success-tag { position: absolute; top: .75rem; right: .75rem; background: #ecfdf5; color: #059669; font-size: .6875rem; font-weight: 700; padding: .2rem .5rem; border-radius: 999px; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

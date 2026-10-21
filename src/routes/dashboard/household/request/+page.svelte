<!-- src/routes/dashboard/household/request/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Trash2, Loader2, ArrowLeft, Info } from 'lucide-svelte';
  import { formatCurrency, formatWeight } from '$lib/utils/api';

  export let data;
  $: ({ categories, profile } = data);

  let loading = false;
  let error = '';
  let fieldErrors: Record<string, string> = {};
  let success = false;

  let categoryId = '';
  let estimatedWeight = '';
  let description = '';
  let address = profile?.address ?? '';
  let preferredDate = '';
  let notes = '';

  $: selectedCategory = categories.find((c: any) => c.id === categoryId);
  $: estimatedFee = selectedCategory && estimatedWeight
    ? selectedCategory.baseFee + (selectedCategory.collectorFeePerKg * Number(estimatedWeight))
    : 0;

  async function handleSubmit() {
    error = '';
    fieldErrors = {};
    if (!categoryId) { fieldErrors.categoryId = 'Please select a waste type'; return; }
    if (!estimatedWeight || Number(estimatedWeight) <= 0) { fieldErrors.estimatedWeight = 'Enter an estimated weight'; return; }
    if (!address.trim()) { fieldErrors.address = 'Pickup address is required'; return; }

    loading = true;
    try {
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          wasteType: selectedCategory?.type,
          estimatedWeight: Number(estimatedWeight),
          description: description || undefined,
          address,
          preferredDate: preferredDate || undefined,
          notes: notes || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.errors) fieldErrors = result.errors;
        else error = result.message ?? 'Request failed';
        return;
      }
      success = true;
    } catch {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Request Pickup — WasteLink</title></svelte:head>

<div class="request-page stagger-children">
  <a href="/dashboard/household" class="back-link">
    <ArrowLeft size={15}/> Back to Dashboard
  </a>

  {#if success}
    <div class="success-card">
      <div class="sc-icon">✅</div>
      <h2>Pickup Requested!</h2>
      <p>Your request has been submitted. Available collectors in your area will be notified and one will accept your pickup shortly.</p>
      <div class="sc-actions">
        <a href="/dashboard/household/pickups" class="btn-primary">Track Pickup</a>
        <button class="btn-secondary" on:click={() => { success = false; categoryId = ''; estimatedWeight = ''; description = ''; notes = ''; }}>
          Request Another
        </button>
      </div>
    </div>
  {:else}
    <div class="form-card">
      <div class="fc-header">
        <div class="fc-icon"><Trash2 size={22} strokeWidth={1.5}/></div>
        <div>
          <h1>Request Waste Pickup</h1>
          <p>Collectors in your area will see and accept your request.</p>
        </div>
      </div>

      {#if error}
        <div class="form-error-box">{error}</div>
      {/if}

      <div class="form-body">
        <!-- Waste Type -->
        <div class="form-group">
          <label class="label" for="cat">Waste Type <span class="req">*</span></label>
          <select id="cat" class="input" class:error={fieldErrors.categoryId} bind:value={categoryId}>
            <option value="">Select waste type</option>
            {#each categories as c}
              <option value={c.id}>{c.name} — {formatCurrency(c.baseFee)} base + {formatCurrency(c.collectorFeePerKg)}/kg</option>
            {/each}
          </select>
          {#if fieldErrors.categoryId}<p class="form-error">{fieldErrors.categoryId}</p>{/if}
        </div>

        <!-- Category info -->
        {#if selectedCategory}
          <div class="cat-info">
            <Info size={13}/>
            <span>{selectedCategory.description}</span>
          </div>
        {/if}

        <!-- Weight -->
        <div class="form-group">
          <label class="label" for="weight">Estimated Weight (kg) <span class="req">*</span></label>
          <input id="weight" type="number" class="input" class:error={fieldErrors.estimatedWeight}
            bind:value={estimatedWeight} placeholder="e.g. 5" min="0.1" step="0.1"/>
          {#if fieldErrors.estimatedWeight}<p class="form-error">{fieldErrors.estimatedWeight}</p>{/if}
        </div>

        <!-- Fee Preview -->
        {#if estimatedFee > 0}
          <div class="fee-preview">
            <span class="fp-label">Estimated Pickup Fee</span>
            <span class="fp-amount">{formatCurrency(estimatedFee)}</span>
            <span class="fp-note">Base: {formatCurrency(selectedCategory?.baseFee ?? 0)} + {formatCurrency(selectedCategory?.collectorFeePerKg ?? 0)}/kg × {estimatedWeight}kg</span>
          </div>
        {/if}

        <!-- Address -->
        <div class="form-group">
          <label class="label" for="addr">Pickup Address <span class="req">*</span></label>
          <input id="addr" class="input" class:error={fieldErrors.address} bind:value={address}
            placeholder="Full address where waste will be collected"/>
          {#if fieldErrors.address}<p class="form-error">{fieldErrors.address}</p>{/if}
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="label" for="desc">Description (optional)</label>
          <textarea id="desc" class="input" rows="2" bind:value={description}
            placeholder="Describe the waste (condition, packaging, etc.)"></textarea>
        </div>

        <!-- Preferred Date -->
        <div class="form-group">
          <label class="label" for="date">Preferred Pickup Date (optional)</label>
          <input id="date" type="date" class="input" bind:value={preferredDate}
            min={new Date().toISOString().slice(0, 10)}/>
        </div>

        <button class="btn-primary submit-btn" on:click={handleSubmit} disabled={loading}>
          {#if loading}<Loader2 size={16} class="spin"/> Submitting...
          {:else}<Trash2 size={15}/> Submit Pickup Request{/if}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .request-page { max-width: 600px; }
  .back-link { display: inline-flex; align-items: center; gap: .375rem; color: #64748b; text-decoration: none; font-size: .875rem; font-weight: 500; margin-bottom: 1.25rem; transition: color .15s; }
  .back-link:hover { color: #059669; }

  .success-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; padding: 3rem 2rem; text-align: center; }
  .sc-icon { font-size: 3rem; margin-bottom: .75rem; }
  .success-card h2 { font-size: 1.375rem; font-weight: 800; color: #0f172a; margin: 0 0 .5rem; letter-spacing: -.03em; }
  .success-card p  { font-size: .9375rem; color: #64748b; line-height: 1.6; margin: 0 0 1.5rem; }
  .sc-actions { display: flex; gap: .625rem; justify-content: center; }

  .form-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; overflow: hidden; }
  .fc-header { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
  .fc-icon { width: 48px; height: 48px; background: #ecfdf5; color: #059669; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .fc-header h1 { font-size: 1.0625rem; font-weight: 800; color: #0f172a; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .fc-header p  { font-size: .8125rem; color: #64748b; margin: 0; }

  .form-error-box { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .75rem 1rem; font-size: .875rem; margin: 1rem 1.5rem 0; border-radius: 8px; }
  .form-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .form-group { display: flex; flex-direction: column; gap: .3rem; }
  .req { color: #ef4444; }
  textarea.input { resize: vertical; font-family: var(--font-body); }

  .cat-info { display: flex; align-items: center; gap: .375rem; padding: .625rem .875rem; background: #eff6ff; border-radius: 7px; font-size: .8125rem; color: #1e40af; }

  .fee-preview { padding: 1rem; background: #f0fdf4; border: 1.5px solid #6ee7b7; border-radius: .875rem; }
  .fp-label  { display: block; font-size: .6875rem; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .25rem; }
  .fp-amount { display: block; font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #065f46; letter-spacing: -.03em; }
  .fp-note   { display: block; font-size: .75rem; color: #059669; margin-top: .25rem; }

  .submit-btn { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: .75rem; font-size: .9375rem; }
  .submit-btn:disabled { opacity: .7; cursor: not-allowed; transform: none; }
  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

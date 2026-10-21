<!-- src/routes/dashboard/admin/add-recycler/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Building2, Loader2, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-svelte';

  export let data;

  let loading = false;
  let success = false;
  let createdCreds: { email: string; password: string; company: string } | null = null;
  let error = '';
  let fieldErrors: Record<string, string> = {};
  let showPassword = false;

  let name = '';
  let email = '';
  let password = generatePassword();
  let phone = '';
  let companyName = '';
  let businessLicense = '';
  let address = '';
  let capacity = '';
  let wasteTypes: string[] = [];

  const allWasteTypes = ['ORGANIC','PLASTIC','METAL','GLASS','PAPER','HAZARDOUS','ELECTRONIC','MIXED'];

  function generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p + '!2';
  }

  function toggleWasteType(t: string) {
    wasteTypes = wasteTypes.includes(t) ? wasteTypes.filter(x => x !== t) : [...wasteTypes, t];
  }

  async function handleSubmit() {
    error = '';
    fieldErrors = {};
    if (!name.trim())            { fieldErrors.name = 'Contact name required'; return; }
    if (!email.trim())           { fieldErrors.email = 'Email required'; return; }
    if (!companyName.trim())     { fieldErrors.companyName = 'Company name required'; return; }
    if (!businessLicense.trim()) { fieldErrors.businessLicense = 'Business license required'; return; }
    if (!address.trim())         { fieldErrors.address = 'Address required'; return; }
    if (!capacity || Number(capacity) <= 0) { fieldErrors.capacity = 'Capacity required'; return; }
    if (wasteTypes.length === 0) { fieldErrors.wasteTypes = 'Select at least one waste type'; return; }

    loading = true;
    try {
      const res = await fetch('/api/admin/recyclers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: phone || undefined, companyName, businessLicense, address, capacity: Number(capacity), wasteTypes }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.errors) fieldErrors = result.errors;
        else error = result.message ?? 'Failed to create recycler';
        return;
      }
      success = true;
      createdCreds = { email, password, company: companyName };
    } catch {
      error = 'Network error. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Add Recycler — WasteLink Admin</title></svelte:head>

<div class="add-recycler-page stagger-children">
  <a href="/dashboard/admin/recyclers" class="back-link">
    <ArrowLeft size={15}/> Back to Recyclers
  </a>

  {#if success && createdCreds}
    <div class="success-card">
      <CheckCircle size={48} class="sc-icon"/>
      <h2>Recycler Account Created!</h2>
      <p>Share these login credentials with <strong>{createdCreds.company}</strong>. They must change their password on first login.</p>
      <div class="creds-box">
        <div class="cred-row"><span class="cr-label">Email</span><span class="cr-val">{createdCreds.email}</span></div>
        <div class="cred-row"><span class="cr-label">Temp Password</span><span class="cr-val password">{createdCreds.password}</span></div>
        <p class="cred-note">⚠️ They will be prompted to change this on first login.</p>
      </div>
      <div class="sc-actions">
        <a href="/dashboard/admin/recyclers" class="btn-primary">View All Recyclers</a>
        <button class="btn-secondary" on:click={() => { success = false; createdCreds = null; name = ''; email = ''; phone = ''; companyName = ''; businessLicense = ''; address = ''; capacity = ''; wasteTypes = []; password = generatePassword(); }}>Add Another</button>
      </div>
    </div>
  {:else}
    <div class="form-card">
      <div class="fc-header">
        <div class="fc-icon"><Building2 size={22} strokeWidth={1.5}/></div>
        <div>
          <h1>Add Recycler Company</h1>
          <p>Account will be created with a temporary password. The company must change it on first login.</p>
        </div>
      </div>

      {#if error}<div class="form-error-box">{error}</div>{/if}

      <div class="form-body">
        <h3 class="section-title">Contact Person</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="label" for="name">Full Name <span class="req">*</span></label>
            <input id="name" class="input" class:error={fieldErrors.name} bind:value={name} placeholder="John Doe"/>
            {#if fieldErrors.name}<p class="form-error">{fieldErrors.name}</p>{/if}
          </div>
          <div class="form-group">
            <label class="label" for="phone">Phone Number</label>
            <input id="phone" class="input" bind:value={phone} placeholder="+256 7XX XXX XXX"/>
          </div>
        </div>
        <div class="form-group">
          <label class="label" for="email">Email Address <span class="req">*</span></label>
          <input id="email" type="email" class="input" class:error={fieldErrors.email} bind:value={email} placeholder="company@email.com"/>
          {#if fieldErrors.email}<p class="form-error">{fieldErrors.email}</p>{/if}
        </div>
        <div class="form-group">
          <label class="label" for="pw">Temporary Password</label>
          <div class="input-wrap">
            <input id="pw" type={showPassword ? 'text' : 'password'} class="input pr-input" bind:value={password}/>
            <button type="button" class="toggle-pw" on:click={() => showPassword = !showPassword} aria-label="Toggle">
              {#if showPassword}<EyeOff size={14}/>{:else}<Eye size={14}/>{/if}
            </button>
          </div>
          <p class="field-hint">Auto-generated. The user will be forced to change this.</p>
        </div>

        <h3 class="section-title">Company Details</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="label" for="company">Company Name <span class="req">*</span></label>
            <input id="company" class="input" class:error={fieldErrors.companyName} bind:value={companyName} placeholder="EcoFuture Uganda Ltd"/>
            {#if fieldErrors.companyName}<p class="form-error">{fieldErrors.companyName}</p>{/if}
          </div>
          <div class="form-group">
            <label class="label" for="lic">Business License <span class="req">*</span></label>
            <input id="lic" class="input" class:error={fieldErrors.businessLicense} bind:value={businessLicense} placeholder="BL-2024-RCY-001"/>
            {#if fieldErrors.businessLicense}<p class="form-error">{fieldErrors.businessLicense}</p>{/if}
          </div>
        </div>
        <div class="form-group">
          <label class="label" for="addr">Company Address <span class="req">*</span></label>
          <input id="addr" class="input" class:error={fieldErrors.address} bind:value={address} placeholder="Plot 12, Industrial Area, Kampala"/>
          {#if fieldErrors.address}<p class="form-error">{fieldErrors.address}</p>{/if}
        </div>
        <div class="form-group">
          <label class="label" for="cap">Processing Capacity (kg/month) <span class="req">*</span></label>
          <input id="cap" type="number" class="input" class:error={fieldErrors.capacity} bind:value={capacity} placeholder="5000" min="1"/>
          {#if fieldErrors.capacity}<p class="form-error">{fieldErrors.capacity}</p>{/if}
        </div>

        <div class="form-group">
          <label class="label">Accepted Waste Types <span class="req">*</span></label>
          <div class="waste-types-grid">
            {#each allWasteTypes as t}
              <button type="button" class="wt-btn" class:selected={wasteTypes.includes(t)} on:click={() => toggleWasteType(t)}>
                {t}
              </button>
            {/each}
          </div>
          {#if fieldErrors.wasteTypes}<p class="form-error">{fieldErrors.wasteTypes}</p>{/if}
        </div>

        <button class="btn-primary submit-btn" on:click={handleSubmit} disabled={loading}>
          {#if loading}<Loader2 size={16} class="spin"/> Creating account...
          {:else}<Building2 size={15}/> Create Recycler Account{/if}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .add-recycler-page { max-width: 640px; }
  .back-link { display: inline-flex; align-items: center; gap: .375rem; color: #64748b; text-decoration: none; font-size: .875rem; font-weight: 500; margin-bottom: 1.25rem; transition: color .15s; }
  .back-link:hover { color: #059669; }

  .success-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; padding: 3rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
  :global(.sc-icon) { color: #059669; }
  .success-card h2 { font-size: 1.375rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .success-card > p { font-size: .9375rem; color: #64748b; line-height: 1.6; margin: 0; }
  .creds-box { width: 100%; background: #f0fdf4; border: 1.5px solid #6ee7b7; border-radius: .875rem; padding: 1.25rem; }
  .cred-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: .5rem; }
  .cr-label { font-size: .75rem; color: #059669; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .cr-val { font-size: .9375rem; font-weight: 700; color: #065f46; }
  .cr-val.password { font-family: monospace; background: white; padding: .2rem .5rem; border-radius: 6px; }
  .cred-note { font-size: .75rem; color: #a16207; margin: .625rem 0 0; }
  .sc-actions { display: flex; gap: .625rem; }

  .form-card { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; overflow: hidden; }
  .fc-header { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
  .fc-icon { width: 48px; height: 48px; background: #f5f3ff; color: #8b5cf6; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .fc-header h1 { font-size: 1.0625rem; font-weight: 800; color: #0f172a; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .fc-header p  { font-size: .8125rem; color: #64748b; margin: 0; }
  .form-error-box { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .75rem 1rem; font-size: .875rem; margin: 1rem 1.5rem 0; border-radius: 8px; }
  .form-body { padding: 1.5rem; display: flex; flex-direction: column; gap: .875rem; }
  .section-title { font-size: .875rem; font-weight: 700; color: #0f172a; margin: .375rem 0 0; padding-bottom: .5rem; border-bottom: 1px solid #f1f5f9; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
  @media(max-width:480px){ .form-row { grid-template-columns: 1fr; } }
  .form-group { display: flex; flex-direction: column; gap: .3rem; }
  .req { color: #ef4444; }
  .input-wrap { position: relative; }
  .pr-input { padding-right: 2.5rem; }
  .toggle-pw { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; }
  .field-hint { font-size: .6875rem; color: #94a3b8; margin: .2rem 0 0; }
  .waste-types-grid { display: flex; flex-wrap: wrap; gap: .5rem; }
  .wt-btn { padding: .35rem .75rem; background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 999px; font-size: .75rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .wt-btn.selected { background: #8b5cf6; border-color: #8b5cf6; color: white; }
  .submit-btn { display: flex; align-items: center; justify-content: center; gap: .5rem; padding: .75rem; font-size: .9375rem; }
  .submit-btn:disabled { opacity: .7; cursor: not-allowed; transform: none; }
  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

<!-- src/routes/dashboard/household/become-collector/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Truck, CheckCircle, Clock, XCircle, Loader2, ArrowLeft, Info, AlertTriangle } from 'lucide-svelte';

  export let data;
  $: ({ existingRequest, collectorsEnabledGlobal, zoneStatus } = data);

  let loading = false;
  let error = '';
  let fieldErrors: Record<string, string> = {};
  let success = false;
  let vehicleType = '';
  let vehiclePlate = '';
  let reason = '';

  const vehicles = ['Pickup Truck','Tricycle (Boda Cargo)','Light Truck','Heavy Truck','Handcart'];

  $: applicationsClosed = !collectorsEnabledGlobal || !zoneStatus?.enabled;
  $: closedReason = !collectorsEnabledGlobal
    ? 'The city authority has temporarily suspended all collector applications.'
    : zoneStatus?.reason ?? 'Applications are closed in your zone.';

  $: statusConfig = existingRequest ? {
    PENDING:  { icon: Clock,       color:'#f59e0b', bg:'#fffbeb', border:'#fcd34d', label:'Under Review',  desc:'Your application is being reviewed by the city authority.' },
    APPROVED: { icon: CheckCircle, color:'#059669', bg:'#ecfdf5', border:'#6ee7b7', label:'Approved!',     desc:'Log out and back in to access your collector dashboard.' },
    REJECTED: { icon: XCircle,     color:'#ef4444', bg:'#fef2f2', border:'#fca5a5', label:'Not Approved',  desc: existingRequest?.adminNote ?? 'Your application was not approved. You may reapply.' },
  }[existingRequest.status] : null;

  async function handleSubmit() {
    error = ''; fieldErrors = {};
    if (!vehicleType) { fieldErrors.vehicleType = 'Select your vehicle type'; return; }
    if (!vehiclePlate.trim()) { fieldErrors.vehiclePlate = 'Enter your license plate'; return; }
    loading = true;
    try {
      const res = await fetch('/api/collector-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleType, vehiclePlate: vehiclePlate.toUpperCase(), reason }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.errors) fieldErrors = result.errors;
        else error = result.message ?? 'Submission failed';
        return;
      }
      success = true;
    } catch { error = 'Network error. Please try again.';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Become a Collector — WasteLink</title></svelte:head>

<div class="become-page stagger-children">
  <a href="/dashboard/household" class="back-link"><ArrowLeft size={15}/> Back to Dashboard</a>

  <div class="become-card">
    <div class="bc-hero">
      <div class="bc-icon"><Truck size={32} strokeWidth={1.5}/></div>
      <h1>Become a Waste Collector</h1>
      <p>Apply to join WasteLink's verified collector network and earn income collecting waste in your area.</p>
    </div>

    {#if success}
      <div class="success-state">
        <CheckCircle size={48} strokeWidth={1.5}/>
        <h2>Application Submitted!</h2>
        <p>Your application has been sent to the city authority. You'll be notified once reviewed (1–2 business days).</p>
        <a href="/dashboard/household" class="btn-primary">Return to Dashboard</a>
      </div>

    {:else if applicationsClosed && !existingRequest}
      <div class="closed-notice">
        <div class="cn-icon"><AlertTriangle size={28} strokeWidth={1.5}/></div>
        <div class="cn-text">
          <strong>Applications Currently Closed</strong>
          <p>{closedReason}</p>
          <p class="cn-sub">Check back later or contact admin@kampala.go.ug.</p>
        </div>
      </div>

    {:else if existingRequest && statusConfig}
      <div class="status-box" style="background:{statusConfig.bg};border-color:{statusConfig.border}">
        <div class="sb-icon" style="color:{statusConfig.color}"><svelte:component this={statusConfig.icon} size={28} strokeWidth={1.5}/></div>
        <div class="sb-text">
          <strong style="color:{statusConfig.color}">{statusConfig.label}</strong>
          <p>{statusConfig.desc}</p>
          {#if existingRequest.status === 'APPROVED'}
            <div class="approved-details">
              {#if existingRequest.licenseNumber}<span>🪪 License: <strong>{existingRequest.licenseNumber}</strong></span>{/if}
              {#if existingRequest.assignedZone}<span>📍 Zone: <strong>{existingRequest.assignedZone}</strong></span>{/if}
            </div>
            <button class="btn-logout" on:click={async () => { await fetch('/api/auth/logout',{method:'POST'}); goto('/auth/login'); }}>Log out & Activate</button>
          {/if}
        </div>
      </div>
      {#if existingRequest.status === 'REJECTED' && !applicationsClosed}
        <div class="reapply-notice"><Info size={14}/> You can submit a new application below.</div>
      {/if}
    {:else}
      {#if zoneStatus?.zone}
        <div class="zone-info" class:zone-ok={zoneStatus.enabled}><Info size={13}/><span>{zoneStatus.reason}</span></div>
      {/if}
      <div class="benefits">
        <h3>Why become a collector?</h3>
        <div class="benefits-grid">
          <div class="benefit-item"><span>💰</span><div><strong>Earn Income</strong><span>Avg UGX 8,000–25,000 per job</span></div></div>
          <div class="benefit-item"><span>📱</span><div><strong>App-Managed</strong><span>Accept jobs, track pickups, view earnings</span></div></div>
          <div class="benefit-item"><span>🌿</span><div><strong>City-Verified</strong><span>Official license from city authority</span></div></div>
          <div class="benefit-item"><span>🗺️</span><div><strong>Zone-Based</strong><span>Work in your local area</span></div></div>
        </div>
      </div>
    {/if}

    {#if !existingRequest || existingRequest.status === 'REJECTED'}
      {#if !applicationsClosed}
        <div class="form-section">
          <h3>Application Form</h3>
          {#if error}<div class="form-error-box">{error}</div>{/if}
          <div class="app-form">
            <div class="form-group">
              <label class="label" for="vtype">Vehicle Type <span class="req">*</span></label>
              <select id="vtype" class="input" class:error={fieldErrors.vehicleType} bind:value={vehicleType}>
                <option value="">Select your vehicle</option>
                {#each vehicles as v}<option value={v}>{v}</option>{/each}
              </select>
              {#if fieldErrors.vehicleType}<p class="form-error">{fieldErrors.vehicleType}</p>{/if}
            </div>
            <div class="form-group">
              <label class="label" for="plate">License Plate <span class="req">*</span></label>
              <input id="plate" class="input" class:error={fieldErrors.vehiclePlate} bind:value={vehiclePlate} placeholder="e.g. UAA 123B" style="text-transform:uppercase"/>
              {#if fieldErrors.vehiclePlate}<p class="form-error">{fieldErrors.vehiclePlate}</p>{/if}
            </div>
            <div class="form-group">
              <label class="label" for="reason">Why do you want to become a collector? (optional)</label>
              <textarea id="reason" class="input" rows="3" bind:value={reason} placeholder="Briefly describe your motivation..."></textarea>
            </div>
            <button class="btn-primary submit-btn" on:click={handleSubmit} disabled={loading}>
              {#if loading}<Loader2 size={16} class="spin"/> Submitting...
              {:else}<Truck size={15}/> Submit Application{/if}
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .become-page { max-width: 680px; }
  .back-link { display:inline-flex;align-items:center;gap:.375rem;color:#64748b;text-decoration:none;font-size:.875rem;font-weight:500;margin-bottom:1.25rem;transition:color .15s; }
  .back-link:hover { color:#059669; }
  .become-card { background:white;border:1px solid #e2e8f0;border-radius:1.25rem;overflow:hidden; }
  .bc-hero { background:linear-gradient(135deg,#065f46,#059669,#0d9488);padding:2.5rem 2rem;color:white;text-align:center; }
  .bc-icon { width:72px;height:72px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:white; }
  .bc-hero h1 { font-size:1.375rem;font-weight:800;margin:0 0 .5rem;letter-spacing:-.03em; }
  .bc-hero p  { color:rgba(255,255,255,.85);font-size:.9375rem;line-height:1.6;margin:0 auto;max-width:480px; }
  .success-state { display:flex;flex-direction:column;align-items:center;gap:.875rem;padding:3rem 2rem;text-align:center;color:#059669; }
  .success-state h2 { font-size:1.25rem;font-weight:800;color:#0f172a;margin:0; }
  .success-state p  { font-size:.9375rem;color:#64748b;max-width:400px;line-height:1.6;margin:0; }
  .closed-notice { display:flex;align-items:flex-start;gap:1rem;margin:1.5rem;padding:1.25rem;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:.875rem; }
  .cn-icon { color:#dc2626;flex-shrink:0;margin-top:2px; }
  .cn-text strong { display:block;font-size:.9375rem;font-weight:700;color:#991b1b;margin-bottom:.4rem; }
  .cn-text p { font-size:.875rem;color:#7f1d1d;margin:0 0 .5rem;line-height:1.5; }
  .cn-sub { font-style:italic;font-size:.8125rem !important; }
  .zone-info { display:flex;align-items:center;gap:.5rem;margin:1rem 1.5rem 0;padding:.625rem .875rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:.625rem;font-size:.8125rem;color:#92400e; }
  .zone-info.zone-ok { background:#ecfdf5;border-color:#6ee7b7;color:#065f46; }
  .status-box { display:flex;align-items:flex-start;gap:1rem;margin:1.5rem;padding:1.25rem;border:1.5px solid;border-radius:.875rem; }
  .sb-icon { flex-shrink:0;margin-top:2px; }
  .sb-text strong { display:block;font-size:1rem;font-weight:700;margin-bottom:.4rem; }
  .sb-text p { font-size:.875rem;color:#475569;margin:0 0 .75rem;line-height:1.5; }
  .approved-details { display:flex;flex-direction:column;gap:.25rem;margin-bottom:.75rem; }
  .approved-details span { font-size:.875rem;color:#334155; }
  .btn-logout { padding:.5rem 1.25rem;background:#059669;color:white;border:none;border-radius:8px;font-size:.875rem;font-weight:700;cursor:pointer;font-family:var(--font-body); }
  .reapply-notice { display:flex;align-items:center;gap:.5rem;margin:0 1.5rem;padding:.75rem 1rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:.8125rem;color:#1e40af;font-weight:500; }
  .benefits { padding:1.5rem 2rem;border-bottom:1px solid #f1f5f9; }
  .benefits h3 { font-size:.9375rem;font-weight:700;color:#0f172a;margin:0 0 1rem; }
  .benefits-grid { display:grid;grid-template-columns:1fr 1fr;gap:.75rem; }
  @media(max-width:480px){ .benefits-grid { grid-template-columns:1fr; } }
  .benefit-item { display:flex;align-items:flex-start;gap:.75rem;padding:.875rem;background:#f8fafc;border-radius:.75rem; }
  .benefit-item span:first-child { font-size:1.25rem;flex-shrink:0; }
  .benefit-item strong { display:block;font-size:.875rem;font-weight:700;color:#1e293b;margin-bottom:.2rem; }
  .benefit-item span:last-child { font-size:.75rem;color:#64748b;line-height:1.4; }
  .form-section { padding:1.5rem 2rem; }
  .form-section h3 { font-size:.9375rem;font-weight:700;color:#0f172a;margin:0 0 .875rem; }
  .form-error-box { background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:.75rem 1rem;border-radius:8px;font-size:.875rem;margin-bottom:1rem; }
  .app-form { display:flex;flex-direction:column;gap:.875rem; }
  .form-group { display:flex;flex-direction:column;gap:.3rem; }
  .req { color:#ef4444; }
  textarea.input { resize:vertical;font-family:var(--font-body);min-height:80px; }
  .submit-btn { display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.75rem;font-size:.9375rem; }
  .submit-btn:disabled { opacity:.7;cursor:not-allowed;transform:none; }
  :global(.spin) { animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>

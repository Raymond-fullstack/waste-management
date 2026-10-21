<!-- src/routes/dashboard/admin/collector-requests/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Truck, CheckCircle, XCircle, Clock, Loader2, Info, Map } from 'lucide-svelte';
  import { timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ requests, total, statusFilter, pendingCount, zones } = data);

  const statuses = ['PENDING','APPROVED','REJECTED','ALL'];

  let processing: string | null = null;
  let actionModal: { id: string; name: string; action: 'approve'|'reject'; requestedZone?: string } | null = null;
  let selectedZoneId = '';
  let adminNote = '';
  let rejectReason = '';
  let formError = '';
  let approvalResult: { licenseNumber: string; zone: string } | null = null;

  function setFilter(s: string) {
    const p = new URLSearchParams($page.url.searchParams);
    p.set('status', s); p.delete('page');
    goto(`?${p.toString()}`);
  }

  function openApprove(req: any) {
    actionModal = { id: req.id, name: req.user?.name, action: 'approve', requestedZone: req.zone?.name };
    const match = zones?.find((z: any) => z.id === req.zoneId);
    selectedZoneId = match ? match.id : '';
    adminNote = ''; formError = ''; approvalResult = null;
  }

  function openReject(req: any) {
    actionModal = { id: req.id, name: req.user?.name, action: 'reject' };
    rejectReason = ''; formError = '';
  }

  async function submitAction() {
    if (!actionModal) return;
    formError = '';
    if (actionModal.action === 'approve' && !selectedZoneId) { formError = 'Please select a zone'; return; }
    if (actionModal.action === 'reject' && !rejectReason.trim()) { formError = 'Please provide a reason'; return; }
    processing = actionModal.id;
    try {
      const body = actionModal.action === 'approve'
        ? { action: 'approve', zoneId: selectedZoneId, adminNote: adminNote || undefined }
        : { action: 'reject', adminNote: rejectReason };
      const res = await fetch(`/api/collector-requests/${actionModal.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) { formError = result.message ?? 'Failed'; return; }
      if (actionModal.action === 'approve') {
        approvalResult = { licenseNumber: result.data?.licenseNumber, zone: result.data?.zone };
      } else { actionModal = null; window.location.reload(); }
    } catch { formError = 'Network error.';
    } finally { processing = null; }
  }

  function closeAndRefresh() { actionModal = null; approvalResult = null; window.location.reload(); }

  $: pages = Math.ceil(total / data.limit);
</script>

<svelte:head><title>Collector Applications — WasteLink Admin</title></svelte:head>

<div class="cr-page stagger-children">
  <div class="page-top">
    <div class="pt-left">
      <h2>Collector Applications</h2>
      {#if pendingCount > 0}<span class="pending-badge"><Clock size={11}/> {pendingCount} pending</span>{/if}
    </div>
    <div class="filter-tabs">
      {#each statuses as s}
        <button class="ftab" class:active={statusFilter === s} on:click={() => setFilter(s)}>
          {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
        </button>
      {/each}
    </div>
  </div>

  {#if requests.length === 0}
    <div class="empty-state">
      <Truck size={48} strokeWidth={1}/>
      <h3>No applications found</h3>
      <p>Household users who apply to become collectors will appear here.</p>
    </div>
  {:else}
    <div class="req-list">
      {#each requests as req}
        <div class="req-card" class:is-pending={req.status === 'PENDING'}>
          <div class="rc-header">
            <div class="rc-av">{req.user?.name?.charAt(0) ?? '?'}</div>
            <div class="rc-user">
              <span class="rc-name">{req.user?.name}</span>
              <span class="rc-email">{req.user?.email}</span>
              {#if req.user?.phone}<span class="rc-phone">{req.user.phone}</span>{/if}
            </div>
            <div class="rc-status" class:st-pending={req.status==='PENDING'} class:st-approved={req.status==='APPROVED'} class:st-rejected={req.status==='REJECTED'}>
              {req.status}
            </div>
          </div>
          <div class="rc-details">
            <span><Truck size={12}/> {req.vehicleType} · {req.vehiclePlate}</span>
            <span><Clock size={12}/> Applied {timeAgo(req.createdAt)}</span>
            {#if req.reason}<span class="rc-reason">"{req.reason}"</span>{/if}
            {#if req.status === 'APPROVED' && req.licenseNumber}
              <span class="rc-license">🪪 {req.licenseNumber} · 📍 {req.assignedZone ?? req.zone?.name}</span>
            {/if}
            {#if req.status === 'REJECTED' && req.adminNote}
              <span class="rc-rejected-note">❌ {req.adminNote}</span>
            {/if}
          </div>
          {#if req.status === 'PENDING'}
            <div class="rc-actions">
              <button class="btn-approve" on:click={() => openApprove(req)}><CheckCircle size={13}/> Approve & Issue License</button>
              <button class="btn-reject"  on:click={() => openReject(req)}><XCircle size={13}/> Reject</button>
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

<!-- Modal -->
{#if actionModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click|self={() => { if (!approvalResult) actionModal = null; }}>
    <div class="modal-box animate-fade-in-up">
      {#if approvalResult}
        <div class="success-state">
          <div class="ss-emoji">✅</div>
          <h3>Collector Approved!</h3>
          <div class="license-box">
            <div class="lb-row"><span class="lb-label">License</span><span class="lb-val">{approvalResult.licenseNumber}</span></div>
            <div class="lb-row"><span class="lb-label">Zone</span><span class="lb-val">{approvalResult.zone}</span></div>
          </div>
          <p class="ss-note">The user must log out and back in to activate their collector dashboard.</p>
          <button class="btn-primary" on:click={closeAndRefresh}>Done</button>
        </div>

      {:else if actionModal.action === 'approve'}
        <h3>✅ Approve {actionModal.name}</h3>
        <p>Select a zone — license number is <strong>auto-generated</strong> from the zone code.</p>
        {#if actionModal.requestedZone}
          <div class="zone-hint"><Info size={12}/> Requested: <strong>{actionModal.requestedZone}</strong></div>
        {/if}
        {#if formError}<div class="modal-error">{formError}</div>{/if}
        <div class="modal-form">
          <div class="form-group">
            <label class="label" for="mzone">Assign Zone *</label>
            <select id="mzone" class="input" bind:value={selectedZoneId}>
              <option value="">Select a zone</option>
              {#each (zones ?? []) as z}
                {@const isFull = z._count?.collectorProfiles >= z.maxCollectors}
                <option value={z.id} disabled={isFull}>{z.district?.name} — {z.name} ({z._count?.collectorProfiles ?? 0}/{z.maxCollectors}){isFull ? ' FULL' : ''}</option>
              {/each}
            </select>
            {#if (zones ?? []).length === 0}<p class="form-error">No zones available. <a href="/dashboard/admin/zones">Manage zones →</a></p>{/if}
          </div>
          {#if selectedZoneId}
            {@const zone = (zones ?? []).find((z: any) => z.id === selectedZoneId)}
            {#if zone}<div class="zone-preview"><Map size={12}/> License: <strong>{zone.code}-XXXX</strong> (auto-assigned)</div>{/if}
          {/if}
          <div class="form-group">
            <label class="label" for="anote">Note (optional)</label>
            <textarea id="anote" class="input" rows="2" bind:value={adminNote} placeholder="Any additional instructions..."></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-primary modal-btn" on:click={submitAction} disabled={!!processing || !selectedZoneId}>
            {#if processing}<Loader2 size={14} class="spin"/> Processing...{:else}<CheckCircle size={13}/> Approve & Issue License{/if}
          </button>
          <button class="btn-secondary modal-btn" on:click={() => actionModal = null}>Cancel</button>
        </div>

      {:else}
        <h3>❌ Reject {actionModal.name}'s Application</h3>
        <p>Provide a reason — the applicant will be notified and may reapply.</p>
        {#if formError}<div class="modal-error">{formError}</div>{/if}
        <div class="form-group">
          <label class="label" for="rrej">Reason *</label>
          <textarea id="rrej" class="input" rows="3" bind:value={rejectReason} placeholder="e.g. Vehicle does not meet requirements..."></textarea>
        </div>
        <div class="modal-actions mt">
          <button class="btn-danger modal-btn" on:click={submitAction} disabled={!!processing}>
            {#if processing}<Loader2 size={14} class="spin"/> Processing...{:else}<XCircle size={13}/> Reject Application{/if}
          </button>
          <button class="btn-secondary modal-btn" on:click={() => actionModal = null}>Cancel</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .page-top { display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap; }
  .pt-left { display:flex;align-items:center;gap:.75rem;flex-wrap:wrap; }
  .pt-left h2 { font-size:1.125rem;font-weight:800;color:#0f172a;margin:0;letter-spacing:-.03em; }
  .pending-badge { display:flex;align-items:center;gap:.3rem;padding:.25rem .625rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:999px;font-size:.75rem;font-weight:700;color:#92400e; }
  .filter-tabs { display:flex;gap:.375rem;flex-wrap:wrap; }
  .ftab { padding:.375rem .75rem;background:white;border:1.5px solid #e2e8f0;border-radius:999px;font-size:.8125rem;font-weight:600;color:#64748b;cursor:pointer;font-family:var(--font-body);transition:all .15s; }
  .ftab.active { background:#059669;border-color:#059669;color:white; }
  .empty-state { display:flex;flex-direction:column;align-items:center;gap:.875rem;padding:4rem 2rem;background:white;border:1px solid #e2e8f0;border-radius:1rem;text-align:center;color:#94a3b8; }
  .empty-state h3 { font-size:1rem;font-weight:700;color:#475569;margin:0; }
  .empty-state p  { font-size:.875rem;margin:0;max-width:320px; }
  .req-list { display:flex;flex-direction:column;gap:.875rem; }
  .req-card { background:white;border:1px solid #e2e8f0;border-radius:1rem;padding:1.25rem;transition:box-shadow .2s; }
  .req-card.is-pending { border-color:#fcd34d; }
  .req-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.07); }
  .rc-header { display:flex;align-items:flex-start;gap:.875rem;margin-bottom:.875rem; }
  .rc-av { width:42px;height:42px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#059669);color:white;font-weight:700;font-size:1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .rc-user { flex:1;min-width:0; }
  .rc-name  { display:block;font-size:.9375rem;font-weight:700;color:#0f172a; }
  .rc-email { display:block;font-size:.75rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .rc-phone { display:block;font-size:.75rem;color:#94a3b8; }
  .rc-status { padding:.25rem .625rem;border-radius:999px;font-size:.6875rem;font-weight:700;flex-shrink:0; }
  .st-pending  { background:#fffbeb;color:#92400e; }
  .st-approved { background:#ecfdf5;color:#065f46; }
  .st-rejected { background:#fee2e2;color:#991b1b; }
  .rc-details { display:flex;flex-direction:column;gap:.3rem;font-size:.8125rem;color:#475569;margin-bottom:.875rem;padding:.875rem;background:#f8fafc;border-radius:.625rem; }
  .rc-details span { display:flex;align-items:center;gap:.5rem; }
  .rc-reason { font-style:italic;color:#64748b !important; }
  .rc-license { color:#059669 !important;font-weight:600 !important; }
  .rc-rejected-note { color:#dc2626 !important; }
  .rc-actions { display:flex;gap:.5rem; }
  .btn-approve { flex:1;display:flex;align-items:center;justify-content:center;gap:.375rem;padding:.625rem;background:#ecfdf5;color:#059669;border:1.5px solid #6ee7b7;border-radius:8px;font-size:.875rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all .15s; }
  .btn-approve:hover { background:#d1fae5; }
  .btn-reject { display:flex;align-items:center;justify-content:center;gap:.375rem;padding:.625rem 1rem;background:#fee2e2;color:#dc2626;border:1.5px solid #fca5a5;border-radius:8px;font-size:.875rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all .15s; }
  .btn-reject:hover { background:#fecaca; }
  .pagination { display:flex;justify-content:center;gap:.375rem;margin-top:1.5rem; }
  .page-btn { width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:white;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.875rem;font-weight:600;color:#475569;text-decoration:none; }
  .page-btn.active { background:#059669;border-color:#059669;color:white; }
  .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem; }
  .modal-box { background:white;border-radius:1.25rem;padding:1.75rem;width:100%;max-width:460px;max-height:90vh;overflow-y:auto; }
  .modal-box h3 { font-size:1rem;font-weight:800;color:#0f172a;margin:0 0 .4rem; }
  .modal-box > p { font-size:.875rem;color:#64748b;margin:0 0 1.25rem;line-height:1.5; }
  .modal-error { background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:.625rem .875rem;border-radius:8px;font-size:.8125rem;margin-bottom:1rem; }
  .modal-form { display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.25rem; }
  .form-group { display:flex;flex-direction:column;gap:.3rem; }
  textarea.input { resize:vertical;min-height:70px;font-family:var(--font-body); }
  .modal-actions { display:flex;gap:.5rem;flex-direction:column; }
  .modal-actions.mt { margin-top:1rem; }
  .modal-btn { display:flex;align-items:center;justify-content:center;gap:.375rem;padding:.75rem;font-size:.9375rem; }
  .modal-btn:disabled { opacity:.7;cursor:not-allowed;transform:none; }
  .zone-hint { display:flex;align-items:center;gap:.375rem;padding:.5rem .75rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;font-size:.8125rem;color:#1e40af;margin-bottom:.875rem; }
  .zone-preview { display:flex;align-items:center;gap:.375rem;padding:.5rem .75rem;background:#f0fdf4;border:1px solid #6ee7b7;border-radius:7px;font-size:.8125rem;color:#065f46;margin-top:.25rem; }
  .success-state { display:flex;flex-direction:column;align-items:center;text-align:center;gap:.875rem; }
  .ss-emoji { font-size:2.5rem; }
  .success-state h3 { font-size:1.125rem;font-weight:800;color:#0f172a;margin:0; }
  .license-box { width:100%;background:#f0fdf4;border:1.5px solid #6ee7b7;border-radius:.875rem;padding:1rem; }
  .lb-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem; }
  .lb-row:last-child { margin-bottom:0; }
  .lb-label { font-size:.75rem;color:#059669;font-weight:600;text-transform:uppercase;letter-spacing:.04em; }
  .lb-val { font-family:var(--font-display);font-size:1rem;font-weight:800;color:#065f46; }
  .ss-note { font-size:.8125rem;color:#64748b;font-style:italic; }
  :global(.spin) { animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>

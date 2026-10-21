<!-- src/routes/dashboard/admin/zones/+page.svelte -->
<script lang="ts">
  import { Map, Plus, Edit2, ToggleLeft, ToggleRight, Loader2, Building2, Users } from 'lucide-svelte';

  export let data;
  $: ({ districts, zones, collectorsEnabledGlobal } = data);

  let showAddDistrict = false;
  let showAddZone = false;
  let editingZone: any = null;
  let newDistrictName = '';
  let newZoneName = '';
  let newZoneDistrictId = '';
  let newZoneMax = 10;
  let editMax = 10;
  let editEnabled = true;
  let loading: string | null = null;
  let globalToggling = false;
  let error = '';

  async function toggleGlobal() {
    globalToggling = true;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'collectors_enabled_global', value: (!collectorsEnabledGlobal).toString() }),
      });
      if (res.ok) window.location.reload();
    } finally { globalToggling = false; }
  }

  async function addDistrict() {
    if (!newDistrictName.trim()) return;
    loading = 'district';
    const res = await fetch('/api/admin/districts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDistrictName.trim() }),
    });
    if (res.ok) { window.location.reload(); } else { const d = await res.json(); error = d.message; }
    loading = null;
  }

  async function addZone() {
    if (!newZoneName.trim() || !newZoneDistrictId) return;
    loading = 'zone';
    const res = await fetch('/api/admin/zones', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newZoneName.trim(), districtId: newZoneDistrictId, maxCollectors: newZoneMax }),
    });
    if (res.ok) { window.location.reload(); } else { const d = await res.json(); error = d.message; }
    loading = null;
  }

  async function updateZone(zoneId: string) {
    loading = zoneId;
    await fetch(`/api/admin/zones/${zoneId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxCollectors: editMax, collectorsEnabled: editEnabled }),
    });
    loading = null; editingZone = null;
    window.location.reload();
  }

  async function toggleZone(zone: any) {
    loading = zone.id;
    await fetch(`/api/admin/zones/${zone.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectorsEnabled: !zone.collectorsEnabled }),
    });
    loading = null;
    window.location.reload();
  }

  $: zonesByDistrict = districts.map((d: any) => ({
    ...d, zones: zones.filter((z: any) => z.districtId === d.id),
  }));
</script>

<svelte:head><title>Zones & Districts — WasteLink Admin</title></svelte:head>

<div class="zones-page stagger-children">
  <!-- Global Toggle -->
  <div class="global-card" class:disabled={!collectorsEnabledGlobal}>
    <div class="gc-left">
      <div class="gc-icon"><Users size={22}/></div>
      <div>
        <strong>Collector Applications — Global Toggle</strong>
        <p>When disabled, NO household across any zone can apply to become a collector.</p>
      </div>
    </div>
    <button class="toggle-btn" on:click={toggleGlobal} disabled={globalToggling}>
      {#if globalToggling}<Loader2 size={20} class="spin"/>
      {:else if collectorsEnabledGlobal}
        <ToggleRight size={28} class="tog-on"/>
        <span class="tog-label on">Enabled</span>
      {:else}
        <ToggleLeft size={28} class="tog-off"/>
        <span class="tog-label off">Disabled</span>
      {/if}
    </button>
  </div>

  {#if error}<div class="error-box">{error}</div>{/if}

  <!-- Header -->
  <div class="dz-header">
    <h2>Districts & Zones</h2>
    <div class="dz-actions">
      <button class="btn-secondary" on:click={() => showAddZone = !showAddZone}><Plus size={13}/> Add Zone</button>
      <button class="btn-primary"   on:click={() => showAddDistrict = !showAddDistrict}><Plus size={13}/> Add District</button>
    </div>
  </div>

  {#if showAddDistrict}
    <div class="add-form-card">
      <h3><Building2 size={14}/> New District</h3>
      <div class="add-row">
        <input class="input" placeholder="District name (e.g. Gulu)" bind:value={newDistrictName}/>
        <button class="btn-primary" on:click={addDistrict} disabled={loading === 'district' || !newDistrictName.trim()}>
          {loading === 'district' ? 'Adding...' : 'Add'}
        </button>
        <button class="btn-secondary" on:click={() => showAddDistrict = false}>Cancel</button>
      </div>
    </div>
  {/if}

  {#if showAddZone}
    <div class="add-form-card">
      <h3><Map size={14}/> New Zone</h3>
      <div class="add-zone-form">
        <div class="form-group">
          <label class="label">District *</label>
          <select class="input" bind:value={newZoneDistrictId}>
            <option value="">Select district</option>
            {#each districts as d}<option value={d.id}>{d.name}</option>{/each}
          </select>
        </div>
        <div class="form-group">
          <label class="label">Zone name *</label>
          <input class="input" placeholder="e.g. Gulu Central" bind:value={newZoneName}/>
        </div>
        <div class="form-group">
          <label class="label">Max collectors</label>
          <input class="input" type="number" bind:value={newZoneMax} min="1" max="200"/>
        </div>
        <div class="form-btns">
          <button class="btn-primary" on:click={addZone} disabled={loading === 'zone' || !newZoneName.trim() || !newZoneDistrictId}>
            {loading === 'zone' ? 'Adding...' : 'Add Zone'}
          </button>
          <button class="btn-secondary" on:click={() => showAddZone = false}>Cancel</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Districts List -->
  <div class="districts-list">
    {#each zonesByDistrict as d}
      <div class="district-card">
        <div class="dc-header">
          <div class="dc-icon"><Building2 size={15}/></div>
          <h3>{d.name}</h3>
          <span class="dc-count">{d.zones.length} zone{d.zones.length !== 1 ? 's' : ''}</span>
        </div>
        {#if d.zones.length === 0}
          <p class="no-zones">No zones yet.</p>
        {:else}
          <div class="zones-grid">
            {#each d.zones as zone}
              {@const pct = Math.min(100, Math.round(((zone._count?.collectorProfiles ?? 0) / zone.maxCollectors) * 100))}
              <div class="zone-card" class:zone-closed={!zone.collectorsEnabled}>
                <div class="zc-top">
                  <div>
                    <span class="zc-name">{zone.name}</span>
                    <span class="zc-code">{zone.code}</span>
                  </div>
                  <span class="zc-status" class:open={zone.collectorsEnabled}>{zone.collectorsEnabled ? '✓ Open' : '✗ Closed'}</span>
                </div>
                <div class="zc-stats">
                  <span class="zcs-val">{zone._count?.collectorProfiles ?? 0}</span>
                  <span class="zcs-lab">/ {zone.maxCollectors} collectors</span>
                </div>
                <div class="cap-bar"><div class="cap-fill" style="width:{pct}%" class:full={pct>=100} class:high={pct>=80}></div></div>
                <div class="zc-actions">
                  <button class="zc-btn toggle" on:click={() => toggleZone(zone)} disabled={loading === zone.id}>
                    {loading === zone.id ? '...' : zone.collectorsEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button class="zc-btn edit" on:click={() => { editingZone = zone; editMax = zone.maxCollectors; editEnabled = zone.collectorsEnabled; }}>
                    <Edit2 size={11}/> Edit
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
    {#if districts.length === 0}
      <div class="empty-state"><Map size={40} strokeWidth={1}/><h3>No districts yet</h3><p>Add your first district to start managing zones.</p></div>
    {/if}
  </div>
</div>

<!-- Edit Modal -->
{#if editingZone}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click|self={() => editingZone = null}>
    <div class="modal-box animate-fade-in-up">
      <h3>Edit Zone: {editingZone.name}</h3>
      <div class="modal-form">
        <div class="form-group">
          <label class="label">Max Collectors</label>
          <input class="input" type="number" bind:value={editMax} min="1" max="200"/>
        </div>
        <div class="form-group">
          <label class="label">Applications</label>
          <div class="toggle-row">
            <span>{editEnabled ? 'Open for applications' : 'Closed'}</span>
            <button class="icon-toggle" on:click={() => editEnabled = !editEnabled}>
              {#if editEnabled}<ToggleRight size={24} class="tog-on"/>{:else}<ToggleLeft size={24} class="tog-off"/>{/if}
            </button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" on:click={() => updateZone(editingZone.id)} disabled={loading === editingZone.id}>
          {loading === editingZone.id ? 'Saving...' : 'Save Changes'}
        </button>
        <button class="btn-secondary" on:click={() => editingZone = null}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .global-card { background: white; border: 1.5px solid #6ee7b7; border-radius: 1rem; padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .global-card.disabled { border-color: #fca5a5; background: #fff5f5; }
  .gc-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
  .gc-icon { width: 44px; height: 44px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .gc-left strong { display: block; font-size: .9375rem; font-weight: 700; color: #0f172a; margin-bottom: .2rem; }
  .gc-left p { font-size: .8125rem; color: #64748b; margin: 0; }
  .toggle-btn { display: flex; align-items: center; gap: .5rem; background: none; border: none; cursor: pointer; padding: .375rem; border-radius: 8px; transition: background .15s; font-family: var(--font-body); }
  .toggle-btn:disabled { opacity: .6; cursor: not-allowed; }
  :global(.tog-on)  { color: #059669; }
  :global(.tog-off) { color: #94a3b8; }
  .tog-label { font-size: .875rem; font-weight: 700; }
  .tog-label.on  { color: #059669; }
  .tog-label.off { color: #94a3b8; }

  .error-box { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .75rem; border-radius: 8px; margin-bottom: 1rem; font-size: .875rem; }
  .dz-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: .75rem; }
  .dz-header h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .dz-actions { display: flex; gap: .5rem; }
  .dz-actions button { display: flex; align-items: center; gap: .375rem; padding: .4rem .875rem; font-size: .8125rem; }

  .add-form-card { background: white; border: 1px solid #e2e8f0; border-radius: .875rem; padding: 1.25rem; margin-bottom: 1rem; }
  .add-form-card h3 { display: flex; align-items: center; gap: .5rem; font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 .875rem; }
  .add-row { display: flex; gap: .5rem; flex-wrap: wrap; align-items: flex-end; }
  .add-row .input { flex: 1; min-width: 180px; }
  .add-zone-form { display: grid; grid-template-columns: 1fr 1fr 100px; gap: .75rem; align-items: end; }
  @media(max-width:700px){ .add-zone-form { grid-template-columns: 1fr; } }
  .form-group { display: flex; flex-direction: column; gap: .3rem; }
  .form-btns { display: flex; gap: .5rem; align-items: flex-end; padding-bottom: 2px; }
  .form-btns button { padding: .45rem .875rem; font-size: .8125rem; }

  .districts-list { display: flex; flex-direction: column; gap: 1.25rem; }
  .district-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; }
  .dc-header { display: flex; align-items: center; gap: .75rem; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
  .dc-icon { width: 32px; height: 32px; background: #eff6ff; color: #3b82f6; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dc-header h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; flex: 1; }
  .dc-count { font-size: .75rem; color: #94a3b8; }
  .no-zones { font-size: .875rem; color: #94a3b8; padding: 1rem 1.25rem; margin: 0; }

  .zones-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: .75rem; padding: 1rem 1.25rem; }
  .zone-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: .875rem; padding: 1rem; }
  .zone-card.zone-closed { background: #fff5f5; border-color: #fecaca; }
  .zc-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: .625rem; }
  .zc-name { display: block; font-size: .875rem; font-weight: 700; color: #0f172a; }
  .zc-code { display: block; font-size: .6875rem; color: #64748b; font-family: monospace; }
  .zc-status { font-size: .6875rem; font-weight: 700; padding: .2rem .5rem; border-radius: 999px; background: #fee2e2; color: #dc2626; }
  .zc-status.open { background: #ecfdf5; color: #059669; }
  .zc-stats { display: flex; align-items: baseline; gap: .25rem; margin-bottom: .5rem; }
  .zcs-val { font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #0f172a; }
  .zcs-lab { font-size: .6875rem; color: #64748b; }
  .cap-bar { height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: .625rem; }
  .cap-fill { height: 100%; background: #059669; border-radius: 999px; transition: width .4s; }
  .cap-fill.high { background: #f59e0b; }
  .cap-fill.full { background: #ef4444; }
  .zc-actions { display: flex; gap: .375rem; }
  .zc-btn { display: flex; align-items: center; gap: .25rem; padding: .3rem .625rem; border-radius: 6px; font-size: .6875rem; font-weight: 700; cursor: pointer; border: none; font-family: var(--font-body); transition: all .15s; }
  .zc-btn.toggle { background: #f1f5f9; color: #475569; }
  .zc-btn.edit   { background: #eff6ff; color: #3b82f6; }
  .zc-btn:disabled { opacity: .5; cursor: not-allowed; }

  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; color: #94a3b8; text-align: center; }
  .empty-state h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-state p  { font-size: .875rem; margin: 0; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
  .modal-box { background: white; border-radius: 1.25rem; padding: 1.75rem; width: 100%; max-width: 400px; }
  .modal-box h3 { font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0 0 1.25rem; }
  .modal-form { display: flex; flex-direction: column; gap: .875rem; margin-bottom: 1.25rem; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: .5rem .75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .875rem; color: #475569; }
  .icon-toggle { background: none; border: none; cursor: pointer; padding: 0; display: flex; }
  .modal-actions { display: flex; gap: .5rem; }
  .modal-actions .btn-primary, .modal-actions .btn-secondary { flex: 1; justify-content: center; padding: .625rem; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

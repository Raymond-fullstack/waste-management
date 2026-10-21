<!-- src/routes/dashboard/settings/+page.svelte -->
<script lang="ts">
  import { Camera, Loader2, Save, User, Mail, Phone, Shield, Lock, Trash2 } from 'lucide-svelte';

  export let data;
  $: ({ profile, roleDetails } = data);

  let name = profile?.name ?? '';
  let phone = profile?.phone ?? '';
  let avatarPreview: string | null = profile?.avatarUrl ?? null;
  let avatarFile: File | null = null;
  let fileInput: HTMLInputElement;

  let saving = false;
  let error = '';
  let success = false;
  let uploadError = '';

  const roleLabels: Record<string, string> = {
    HOUSEHOLD: 'Household', COLLECTOR: 'Collector', RECYCLER: 'Recycler Company', ADMIN: 'City Admin',
  };
  const roleColors: Record<string, string> = {
    HOUSEHOLD: '#059669', COLLECTOR: '#3b82f6', RECYCLER: '#8b5cf6', ADMIN: '#f59e0b',
  };

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    uploadError = '';

    if (!file.type.startsWith('image/')) { uploadError = 'Please select an image file'; return; }
    if (file.size > 1.5 * 1024 * 1024) { uploadError = 'Image must be under 1.5MB'; return; }

    avatarFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => { avatarPreview = ev.target?.result as string; };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    avatarPreview = null;
    avatarFile = null;
    if (fileInput) fileInput.value = '';
  }

  async function handleSave() {
    error = ''; success = false; saving = true;
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, avatarUrl: avatarPreview }),
      });
      const result = await res.json();
      if (!res.ok) { error = result.message ?? 'Failed to save'; return; }
      success = true;
      setTimeout(() => success = false, 3000);
    } catch { error = 'Network error. Please try again.';
    } finally { saving = false; }
  }
</script>

<svelte:head><title>Settings — WasteLink</title></svelte:head>

<div class="settings-page stagger-children">
  <div class="page-top">
    <h2>Account Settings</h2>
    <p>Manage your profile information and preferences</p>
  </div>

  {#if success}
    <div class="success-banner"><Save size={14}/> Profile updated successfully!</div>
  {/if}
  {#if error}
    <div class="error-banner">{error}</div>
  {/if}

  <div class="settings-grid">
    <!-- Profile Picture & Basic Info -->
    <div class="settings-card">
      <h3>Profile Picture</h3>
      <div class="avatar-section">
        <div class="avatar-wrap">
          {#if avatarPreview}
            <img src={avatarPreview} alt="Profile" class="avatar-img"/>
          {:else}
            <div class="avatar-fallback" style="background:{roleColors[profile?.role ?? 'HOUSEHOLD']}">
              {(profile?.name ?? '?').charAt(0).toUpperCase()}
            </div>
          {/if}
          <button class="avatar-edit-btn" on:click={() => fileInput.click()} aria-label="Change photo">
            <Camera size={14}/>
          </button>
        </div>
        <div class="avatar-actions">
          <button class="btn-secondary" on:click={() => fileInput.click()}>Upload Photo</button>
          {#if avatarPreview}
            <button class="btn-text-danger" on:click={removeAvatar}><Trash2 size={12}/> Remove</button>
          {/if}
          <input bind:this={fileInput} type="file" accept="image/*" on:change={handleFileSelect} hidden/>
        </div>
      </div>
      {#if uploadError}<p class="form-error">{uploadError}</p>{/if}
      <p class="hint-text">JPG, PNG or GIF. Max 1.5MB.</p>
    </div>

    <!-- Personal Info -->
    <div class="settings-card">
      <h3>Personal Information</h3>
      <div class="form-group">
        <label class="label" for="name"><User size={12}/> Full Name</label>
        <input id="name" class="input" bind:value={name} placeholder="Your full name"/>
      </div>
      <div class="form-group">
        <label class="label" for="email"><Mail size={12}/> Email Address</label>
        <input id="email" class="input" value={profile?.email ?? ''} disabled/>
        <p class="hint-text">Email cannot be changed. Contact admin if needed.</p>
      </div>
      <div class="form-group">
        <label class="label" for="phone"><Phone size={12}/> Phone Number</label>
        <input id="phone" class="input" bind:value={phone} placeholder="+256 7XX XXX XXX"/>
      </div>
      <div class="form-group">
        <label class="label"><Shield size={12}/> Account Type</label>
        <div class="role-pill" style="background:color-mix(in srgb,{roleColors[profile?.role ?? 'HOUSEHOLD']} 12%,white);color:{roleColors[profile?.role ?? 'HOUSEHOLD']}">
          {roleLabels[profile?.role ?? 'HOUSEHOLD']}
        </div>
      </div>
      <button class="btn-primary save-btn" on:click={handleSave} disabled={saving}>
        {#if saving}<Loader2 size={15} class="spin"/> Saving...{:else}<Save size={14}/> Save Changes{/if}
      </button>
    </div>

    <!-- Role-specific Info (read-only, no sensitive financials shown to self either way — that's fine) -->
    {#if roleDetails}
      <div class="settings-card">
        <h3>
          {#if profile?.role === 'HOUSEHOLD'}Household Details
          {:else if profile?.role === 'COLLECTOR'}Collector Details
          {:else if profile?.role === 'RECYCLER'}Company Details{/if}
        </h3>
        <div class="detail-list">
          {#if profile?.role === 'HOUSEHOLD'}
            <div class="detail-row"><span>Address</span><strong>{roleDetails.address}</strong></div>
            {#if roleDetails.district}<div class="detail-row"><span>District</span><strong>{roleDetails.district.name}</strong></div>{/if}
            {#if roleDetails.zone}<div class="detail-row"><span>Zone</span><strong>{roleDetails.zone.name}</strong></div>{/if}
          {:else if profile?.role === 'COLLECTOR'}
            <div class="detail-row"><span>License</span><strong>{roleDetails.licenseNumber}</strong></div>
            <div class="detail-row"><span>Vehicle</span><strong>{roleDetails.vehicleType} ({roleDetails.vehiclePlate})</strong></div>
            {#if roleDetails.zone}<div class="detail-row"><span>Zone</span><strong>{roleDetails.zone.name}</strong></div>{/if}
            <div class="detail-row"><span>Rating</span><strong>{roleDetails.rating?.toFixed(1) ?? '0.0'} ★ ({roleDetails.ratingCount} reviews)</strong></div>
          {:else if profile?.role === 'RECYCLER'}
            <div class="detail-row"><span>Company</span><strong>{roleDetails.companyName}</strong></div>
            <div class="detail-row"><span>License</span><strong>{roleDetails.businessLicense}</strong></div>
            <div class="detail-row"><span>Capacity</span><strong>{roleDetails.capacity.toLocaleString()} kg/month</strong></div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Security -->
    <div class="settings-card">
      <h3>Security</h3>
      <a href="/auth/change-password" class="security-link">
        <Lock size={15}/>
        <div>
          <strong>Change Password</strong>
          <span>Update your account password</span>
        </div>
      </a>
    </div>
  </div>
</div>

<style>
  .page-top { margin-bottom: 1.5rem; }
  .page-top h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .25rem; letter-spacing: -.03em; }
  .page-top p  { font-size: .875rem; color: #64748b; margin: 0; }

  .success-banner { display: flex; align-items: center; gap: .5rem; padding: .75rem 1rem; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; border-radius: 8px; font-size: .875rem; font-weight: 600; margin-bottom: 1rem; }
  .error-banner { padding: .75rem 1rem; background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 8px; font-size: .875rem; margin-bottom: 1rem; }

  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; max-width: 900px; }
  @media(max-width: 768px) { .settings-grid { grid-template-columns: 1fr; } }

  .settings-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .settings-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }

  .avatar-section { display: flex; align-items: center; gap: 1.25rem; margin-bottom: .75rem; }
  .avatar-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
  .avatar-img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #f1f5f9; }
  .avatar-fallback { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 700; font-family: var(--font-display); }
  .avatar-edit-btn { position: absolute; bottom: -2px; right: -2px; width: 28px; height: 28px; border-radius: 50%; background: #0f172a; color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
  .avatar-edit-btn:hover { background: #059669; }
  .avatar-actions { display: flex; flex-direction: column; gap: .5rem; align-items: flex-start; }
  .btn-text-danger { display: flex; align-items: center; gap: .3rem; background: none; border: none; color: #ef4444; font-size: .75rem; font-weight: 600; cursor: pointer; padding: 0; font-family: var(--font-body); }
  .hint-text { font-size: .75rem; color: #94a3b8; margin: .375rem 0 0; }

  .form-group { display: flex; flex-direction: column; gap: .3rem; margin-bottom: 1rem; }
  .input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
  .role-pill { display: inline-block; padding: .35rem .875rem; border-radius: 999px; font-size: .8125rem; font-weight: 700; }
  .save-btn { width: 100%; justify-content: center; padding: .65rem; margin-top: .5rem; display: flex; align-items: center; gap: .5rem; }
  .save-btn:disabled { opacity: .7; cursor: not-allowed; transform: none; }

  .detail-list { display: flex; flex-direction: column; gap: .625rem; }
  .detail-row { display: flex; justify-content: space-between; align-items: center; padding: .625rem 0; border-bottom: 1px solid #f1f5f9; font-size: .8125rem; }
  .detail-row:last-child { border-bottom: none; }
  .detail-row span { color: #64748b; }
  .detail-row strong { color: #1e293b; font-weight: 600; text-align: right; }

  .security-link { display: flex; align-items: center; gap: .875rem; padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: .75rem; text-decoration: none; color: #334155; transition: all .15s; }
  .security-link:hover { border-color: #059669; background: #f0fdf4; }
  .security-link strong { display: block; font-size: .875rem; font-weight: 700; color: #0f172a; }
  .security-link span { font-size: .75rem; color: #64748b; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

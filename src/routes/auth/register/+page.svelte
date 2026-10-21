<!-- src/routes/auth/register/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Recycle, Eye, EyeOff, Loader2, Home, ArrowRight } from 'lucide-svelte';

  let loading = false;
  let error = '';
  let fieldErrors: Record<string, string> = {};
  let showPassword = false;
  let name = '';
  let email = '';
  let password = '';
  let phone = '';
  let address = '';
  let districtId = '';
  let zoneId = '';

  let districts: any[] = [];
  let filteredZones: any[] = [];
  let loadingGeo = true;

  onMount(async () => {
    try {
      const res = await fetch('/api/admin/districts');
      const data = await res.json();
      districts = data.data ?? [];
    } catch { districts = []; }
    finally { loadingGeo = false; }
  });

  $: {
    if (districtId) {
      const d = districts.find((x: any) => x.id === districtId);
      filteredZones = d?.zones ?? [];
      zoneId = '';
    } else {
      filteredZones = [];
      zoneId = '';
    }
  }

  async function handleRegister() {
    error = ''; fieldErrors = {};
    loading = true;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'HOUSEHOLD', name, email, password, phone, address, districtId: districtId || undefined, zoneId: zoneId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) fieldErrors = data.errors;
        else error = data.message ?? 'Registration failed';
        return;
      }
      await goto(data.data.redirectTo);
    } catch { error = 'Network error. Please try again.';
    } finally { loading = false; }
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter') handleRegister(); }
</script>

<svelte:head><title>Register — WasteLink</title></svelte:head>

<div class="auth-page">
  <div class="auth-left">
    <div class="auth-left-content">
      <div class="al-logo"><div class="al-icon"><Recycle size={20}/></div><span>WasteLink Uganda</span></div>
      <h2>Join Kampala's<br/>waste revolution</h2>
      <p>Register your household and start requesting waste pickups today.</p>
      <div class="info-cards">
        <div class="ic"><span>🏠</span><div><strong>Households register here</strong><span>Create your home pickup account</span></div></div>
        <div class="ic"><span>🚛</span><div><strong>Want to be a collector?</strong><span>Register as household first, then apply from your dashboard</span></div></div>
        <div class="ic"><span>♻️</span><div><strong>Recycling companies</strong><span>Contact admin@kampala.go.ug to be added</span></div></div>
      </div>
    </div>
  </div>

  <div class="auth-right">
    <div class="auth-box animate-fade-in-up">
      <div class="auth-header">
        <div class="role-badge"><Home size={13}/><span>Household Registration</span></div>
        <h1>Create your account</h1>
        <p>Join thousands of households managing waste responsibly</p>
      </div>

      {#if error}<div class="auth-error">{error}</div>{/if}

      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="auth-form" role="form" on:keydown={handleKeydown}>
        <div class="form-row">
          <div class="form-group">
            <label class="label" for="name">Full name <span class="req">*</span></label>
            <input id="name" class="input" class:error={fieldErrors.name} bind:value={name} placeholder="Sarah Nakato" autocomplete="name"/>
            {#if fieldErrors.name}<p class="form-error">{fieldErrors.name}</p>{/if}
          </div>
          <div class="form-group">
            <label class="label" for="phone">Phone</label>
            <input id="phone" class="input" bind:value={phone} placeholder="+256 7XX XXX XXX" autocomplete="tel"/>
          </div>
        </div>

        <div class="form-group">
          <label class="label" for="email">Email <span class="req">*</span></label>
          <input id="email" type="email" class="input" class:error={fieldErrors.email} bind:value={email} placeholder="you@example.com" autocomplete="email"/>
          {#if fieldErrors.email}<p class="form-error">{fieldErrors.email}</p>{/if}
        </div>

        <div class="form-group">
          <label class="label" for="pw">Password <span class="req">*</span></label>
          <div class="input-wrap">
            <input id="pw" type={showPassword ? 'text' : 'password'} class="input pr-input" class:error={fieldErrors.password}
              bind:value={password} placeholder="Min 8 chars, 1 uppercase, 1 number" autocomplete="new-password"/>
            <button type="button" class="toggle-pw" on:click={() => showPassword = !showPassword} aria-label="Toggle">
              {#if showPassword}<EyeOff size={14}/>{:else}<Eye size={14}/>{/if}
            </button>
          </div>
          {#if fieldErrors.password}<p class="form-error">{fieldErrors.password}</p>{/if}
        </div>

        <div class="form-group">
          <label class="label" for="addr">Home address <span class="req">*</span></label>
          <input id="addr" class="input" class:error={fieldErrors.address} bind:value={address} placeholder="45 Bukoto Street, Kampala"/>
          {#if fieldErrors.address}<p class="form-error">{fieldErrors.address}</p>{/if}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="label" for="district">District</label>
            {#if loadingGeo}
              <div class="input geo-loading">Loading...</div>
            {:else}
              <select id="district" class="input" bind:value={districtId}>
                <option value="">Select district</option>
                {#each districts as d}<option value={d.id}>{d.name}</option>{/each}
              </select>
            {/if}
          </div>
          <div class="form-group">
            <label class="label" for="zone">Zone</label>
            <select id="zone" class="input" bind:value={zoneId} disabled={!districtId || filteredZones.length === 0}>
              <option value="">{!districtId ? 'Select district first' : filteredZones.length === 0 ? 'No zones' : 'Select zone'}</option>
              {#each filteredZones as z}<option value={z.id}>{z.name}</option>{/each}
            </select>
          </div>
        </div>

        <button class="btn-primary reg-btn" on:click={handleRegister} disabled={loading}>
          {#if loading}<Loader2 size={16} class="spin"/> Creating...
          {:else}Create Account <ArrowRight size={14}/>{/if}
        </button>
      </div>

      <p class="auth-footer">Already have an account? <a href="/auth/login">Sign in</a></p>
    </div>
  </div>
</div>

<style>
  .auth-page { min-height:100vh;display:flex; }
  .auth-left { width:42%;background:linear-gradient(160deg,#064e3b 0%,#059669 60%,#0d9488 100%);display:flex;align-items:center;justify-content:center;padding:3rem;color:white; }
  @media(max-width:768px){ .auth-left { display:none; } }
  .auth-left-content { max-width:340px; }
  .al-logo { display:flex;align-items:center;gap:.625rem;font-family:var(--font-display);font-size:1.125rem;font-weight:800;margin-bottom:2rem;letter-spacing:-.03em; }
  .al-icon { width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:9px;display:flex;align-items:center;justify-content:center; }
  .auth-left-content h2 { font-size:1.75rem;font-weight:800;line-height:1.2;letter-spacing:-.03em;margin:0 0 .75rem; }
  .auth-left-content > p { color:rgba(255,255,255,.8);font-size:.9375rem;line-height:1.6;margin:0 0 2rem; }
  .info-cards { display:flex;flex-direction:column;gap:.625rem; }
  .ic { display:flex;align-items:flex-start;gap:.75rem;padding:.875rem;background:rgba(255,255,255,.1);border-radius:.75rem;border:1px solid rgba(255,255,255,.12); }
  .ic span:first-child { font-size:1.25rem;flex-shrink:0; }
  .ic strong { display:block;font-size:.875rem;font-weight:700;margin-bottom:.15rem; }
  .ic span:last-child { font-size:.75rem;color:rgba(255,255,255,.75);line-height:1.4; }
  .auth-right { flex:1;display:flex;align-items:center;justify-content:center;padding:2rem;background:#f8fafc;overflow-y:auto; }
  .auth-box { width:100%;max-width:500px;background:white;border:1px solid #e2e8f0;border-radius:1.25rem;padding:2rem;box-shadow:0 4px 32px rgba(0,0,0,.06); }
  .auth-header { margin-bottom:1.5rem; }
  .role-badge { display:inline-flex;align-items:center;gap:.375rem;padding:.3rem .75rem;background:#ecfdf5;color:#059669;border-radius:999px;font-size:.75rem;font-weight:700;margin-bottom:.75rem; }
  .auth-header h1 { font-size:1.5rem;font-weight:800;color:#0f172a;letter-spacing:-.03em;margin:0 0 .3rem; }
  .auth-header p { color:#64748b;font-size:.875rem;margin:0; }
  .auth-error { background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:.75rem 1rem;border-radius:8px;font-size:.875rem;margin-bottom:1.25rem; }
  .auth-form { display:flex;flex-direction:column;gap:.875rem; }
  .form-row { display:grid;grid-template-columns:1fr 1fr;gap:.75rem; }
  @media(max-width:480px){ .form-row { grid-template-columns:1fr; } }
  .form-group { display:flex;flex-direction:column;gap:.3rem; }
  .req { color:#ef4444; }
  .input-wrap { position:relative; }
  .pr-input { padding-right:2.5rem; }
  .toggle-pw { position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;display:flex;align-items:center; }
  .geo-loading { color:#94a3b8;font-size:.8125rem;font-style:italic;cursor:default;background:#f8fafc; }
  select:disabled { opacity:.6;cursor:not-allowed;background:#f8fafc; }
  .reg-btn { width:100%;justify-content:center;display:flex;align-items:center;gap:.5rem;padding:.75rem;font-size:.9375rem;margin-top:.25rem; }
  .reg-btn:disabled { opacity:.7;cursor:not-allowed;transform:none; }
  .auth-footer { text-align:center;font-size:.875rem;color:#64748b;margin-top:1.25rem; }
  .auth-footer a { color:#059669;font-weight:600;text-decoration:none; }
  :global(.spin) { animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>

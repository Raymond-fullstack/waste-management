<!-- src/routes/auth/change-password/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { Recycle, Eye, EyeOff, Lock, ShieldCheck, Loader2 } from 'lucide-svelte';

  export let data;

  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let showCurrent = false;
  let showNew = false;
  let showConfirm = false;
  let loading = false;
  let error = '';
  let fieldErrors: Record<string, string> = {};

  const roleLabels: Record<string, string> = {
    RECYCLER: 'Recycler Company', COLLECTOR: 'Collector', HOUSEHOLD: 'Household', ADMIN: 'Admin',
  };

  $: strength = (
    (newPassword.length >= 8 ? 25 : 0) +
    (/[A-Z]/.test(newPassword) ? 25 : 0) +
    (/[0-9]/.test(newPassword) ? 25 : 0) +
    (/[^A-Za-z0-9]/.test(newPassword) ? 25 : 0)
  );

  async function handleSubmit() {
    error = ''; fieldErrors = {};
    if (!currentPassword) { fieldErrors.current = 'Current password is required'; return; }
    if (newPassword.length < 8) { fieldErrors.new = 'Must be at least 8 characters'; return; }
    if (!/[A-Z]/.test(newPassword)) { fieldErrors.new = 'Must contain an uppercase letter'; return; }
    if (!/[0-9]/.test(newPassword)) { fieldErrors.new = 'Must contain a number'; return; }
    if (newPassword !== confirmPassword) { fieldErrors.confirm = 'Passwords do not match'; return; }

    loading = true;
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();
      if (!res.ok) { error = result.message ?? 'Failed to change password'; return; }
      const routes: Record<string, string> = {
        HOUSEHOLD: '/dashboard/household', COLLECTOR: '/dashboard/collector',
        RECYCLER: '/dashboard/recycler', ADMIN: '/dashboard/admin',
      };
      await goto(routes[data.user.role] ?? '/dashboard');
    } catch { error = 'Network error. Please try again.';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Set Password — WasteLink</title></svelte:head>

<div class="cp-page">
  <div class="cp-card animate-fade-in-up">
    <div class="cp-logo"><div class="cl-icon"><Recycle size={22}/></div></div>
    <h1>Set Your Password</h1>
    <p>Your account was created by the city authority as a <strong>{roleLabels[data.user.role] ?? data.user.role}</strong>. Please set a new password to continue.</p>

    <div class="security-notice"><ShieldCheck size={15}/><span>This is required to secure your account. Your temporary password will be replaced.</span></div>

    {#if error}<div class="form-error-box">{error}</div>{/if}

    <div class="cp-form">
      <div class="form-group">
        <label class="label" for="current"><Lock size={12}/> Current (temporary) password</label>
        <div class="input-wrap">
          <input id="current" type={showCurrent ? 'text' : 'password'} class="input pr-input" class:error={fieldErrors.current}
            bind:value={currentPassword} placeholder="Enter the password you were given"/>
          <button type="button" class="toggle-pw" on:click={() => showCurrent = !showCurrent} aria-label="Toggle">
            {#if showCurrent}<EyeOff size={14}/>{:else}<Eye size={14}/>{/if}
          </button>
        </div>
        {#if fieldErrors.current}<p class="form-error">{fieldErrors.current}</p>{/if}
      </div>

      <div class="form-group">
        <label class="label" for="new-pw"><Lock size={12}/> New password</label>
        <div class="input-wrap">
          <input id="new-pw" type={showNew ? 'text' : 'password'} class="input pr-input" class:error={fieldErrors.new}
            bind:value={newPassword} placeholder="Min 8 chars, 1 uppercase, 1 number"/>
          <button type="button" class="toggle-pw" on:click={() => showNew = !showNew} aria-label="Toggle">
            {#if showNew}<EyeOff size={14}/>{:else}<Eye size={14}/>{/if}
          </button>
        </div>
        {#if newPassword}
          <div class="strength-bar"><div class="strength-fill" style="width:{strength}%"></div></div>
          <p class="strength-label">
            {#if strength < 50}Weak{:else if strength < 75}Fair{:else if strength < 100}Good — add a symbol for extra security{:else}Strong ✓{/if}
          </p>
        {/if}
        {#if fieldErrors.new}<p class="form-error">{fieldErrors.new}</p>{/if}
      </div>

      <div class="form-group">
        <label class="label" for="confirm-pw"><Lock size={12}/> Confirm new password</label>
        <div class="input-wrap">
          <input id="confirm-pw" type={showConfirm ? 'text' : 'password'} class="input pr-input" class:error={fieldErrors.confirm}
            bind:value={confirmPassword} placeholder="Repeat your new password"/>
          <button type="button" class="toggle-pw" on:click={() => showConfirm = !showConfirm} aria-label="Toggle">
            {#if showConfirm}<EyeOff size={14}/>{:else}<Eye size={14}/>{/if}
          </button>
        </div>
        {#if fieldErrors.confirm}<p class="form-error">{fieldErrors.confirm}</p>{/if}
      </div>

      <button class="btn-primary submit-btn" on:click={handleSubmit} disabled={loading}>
        {#if loading}<Loader2 size={16} class="spin"/> Setting password...
        {:else}<ShieldCheck size={15}/> Set Password & Continue{/if}
      </button>
    </div>
  </div>
</div>

<style>
  .cp-page { min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;background:linear-gradient(135deg,#f0fdf4 0%,#f8fafc 50%,#eff6ff 100%); }
  .cp-card { background:white;border:1px solid #e2e8f0;border-radius:1.5rem;padding:2.5rem;max-width:440px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.08);text-align:center; }
  .cp-logo { margin-bottom:1.25rem; }
  .cl-icon { width:56px;height:56px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;margin:0 auto; }
  .cp-card h1 { font-size:1.5rem;font-weight:800;color:#0f172a;margin:0 0 .5rem;letter-spacing:-.03em; }
  .cp-card > p { font-size:.875rem;color:#64748b;margin:0 0 1.25rem;line-height:1.6;text-align:center; }
  .security-notice { display:flex;align-items:flex-start;gap:.625rem;padding:.75rem 1rem;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:.75rem;margin-bottom:1.25rem;font-size:.8125rem;color:#065f46;line-height:1.5;text-align:left; }
  .form-error-box { background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:.75rem 1rem;border-radius:8px;font-size:.875rem;margin-bottom:1rem;text-align:left; }
  .cp-form { display:flex;flex-direction:column;gap:1rem;text-align:left; }
  .form-group { display:flex;flex-direction:column;gap:.3rem; }
  .label { display:flex;align-items:center;gap:.35rem; }
  .input-wrap { position:relative; }
  .pr-input { padding-right:2.5rem; }
  .toggle-pw { position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;display:flex;align-items:center; }
  .strength-bar { height:4px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:.375rem; }
  .strength-fill { height:100%;border-radius:999px;transition:width .3s;background:linear-gradient(to right,#ef4444,#f59e0b,#059669); }
  .strength-label { font-size:.6875rem;color:#94a3b8;margin:0; }
  .submit-btn { width:100%;justify-content:center;padding:.75rem;font-size:.9375rem;display:flex;align-items:center;gap:.5rem;margin-top:.25rem; }
  .submit-btn:disabled { opacity:.7;cursor:not-allowed;transform:none; }
  :global(.spin) { animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>

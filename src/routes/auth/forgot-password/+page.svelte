<!-- src/routes/auth/forgot-password/+page.svelte -->
<script lang="ts">
  import { Recycle, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-svelte';

  let email = '';
  let loading = false;
  let submitted = false;
  let error = '';

  async function handleSubmit() {
    if (!email.trim()) { error = 'Please enter your email'; return; }
    loading = true; error = '';
    await new Promise(r => setTimeout(r, 800));
    loading = false; submitted = true;
  }

  function handleKeydown(e: KeyboardEvent) { if (e.key === 'Enter') handleSubmit(); }
</script>

<svelte:head><title>Forgot Password — WasteLink</title></svelte:head>

<div class="fp-page">
  <div class="fp-card animate-fade-in-up">
    <a href="/" class="fp-logo">
      <div class="logo-icon"><Recycle size={16}/></div>
      <span>WasteLink</span>
    </a>

    {#if submitted}
      <div class="success-state">
        <CheckCircle size={42} strokeWidth={1.5} class="ss-icon"/>
        <h1>Check your inbox</h1>
        <p>If <strong>{email}</strong> is registered, you'll receive reset instructions shortly.</p>
        <p class="ss-note">Check spam or contact <a href="mailto:admin@kampala.go.ug">admin@kampala.go.ug</a> if needed.</p>
        <a href="/auth/login" class="btn-primary ss-btn">Back to Sign In</a>
      </div>
    {:else}
      <div class="fp-header">
        <h1>Forgot your password?</h1>
        <p>Enter your email and we'll send reset instructions.</p>
      </div>

      {#if error}<div class="fp-error">{error}</div>{/if}

      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div class="fp-form" role="form" on:keydown={handleKeydown}>
        <div class="form-group">
          <label class="label" for="email"><Mail size={12}/> Email address</label>
          <input id="email" type="email" class="input" bind:value={email}
            placeholder="you@example.com" autocomplete="email"/>
        </div>
        <button class="btn-primary fp-btn" on:click={handleSubmit} disabled={loading}>
          {#if loading}<Loader2 size={15} class="spin"/> Sending...
          {:else}<Mail size={14}/> Send Reset Link{/if}
        </button>
      </div>

      <div class="admin-note">
        <strong>Recycler or Collector account?</strong>
        Your account was created by the city authority. Contact
        <a href="mailto:admin@kampala.go.ug">admin@kampala.go.ug</a> to reset your password.
      </div>

      <a href="/auth/login" class="back-link"><ArrowLeft size={13}/> Back to Sign In</a>
    {/if}
  </div>
</div>

<style>
  .fp-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 2rem; background: linear-gradient(135deg, #f0fdf4, #f8fafc, #eff6ff);
  }
  .fp-card {
    background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem;
    padding: 2.5rem; width: 100%; max-width: 400px;
    box-shadow: 0 8px 40px rgba(0,0,0,.08);
  }
  .fp-logo {
    display: flex; align-items: center; gap: .5rem; text-decoration: none;
    font-family: var(--font-display); font-size: .9375rem; font-weight: 800;
    color: #0f172a; margin-bottom: 2rem; letter-spacing: -.02em;
  }
  .logo-icon {
    width: 28px; height: 28px; background: linear-gradient(135deg, #059669, #0d9488);
    border-radius: 7px; display: flex; align-items: center; justify-content: center; color: white;
  }
  .fp-header { margin-bottom: 1.5rem; }
  .fp-header h1 { font-size: 1.375rem; font-weight: 800; color: #0f172a; margin: 0 0 .4rem; letter-spacing: -.03em; }
  .fp-header p  { font-size: .875rem; color: #64748b; margin: 0; line-height: 1.5; }
  .fp-error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .75rem 1rem; border-radius: 8px; font-size: .875rem; margin-bottom: 1.25rem; }
  .fp-form { display: flex; flex-direction: column; gap: 1rem; }
  .form-group { display: flex; flex-direction: column; gap: .3rem; }
  .fp-btn { width: 100%; justify-content: center; padding: .75rem; font-size: .9375rem; display: flex; align-items: center; gap: .5rem; }
  .fp-btn:disabled { opacity: .7; cursor: not-allowed; transform: none; }
  .admin-note {
    margin-top: 1.25rem; padding: .875rem; background: #eff6ff;
    border: 1px solid #bfdbfe; border-radius: .75rem;
    font-size: .8125rem; color: #1e40af; line-height: 1.5;
  }
  .admin-note strong { display: block; margin-bottom: .2rem; font-size: .875rem; }
  .admin-note a { color: #1d4ed8; font-weight: 600; }
  .back-link {
    display: inline-flex; align-items: center; gap: .375rem;
    margin-top: 1.25rem; color: #64748b; text-decoration: none;
    font-size: .875rem; font-weight: 500; transition: color .15s;
  }
  .back-link:hover { color: #059669; }
  .success-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: .75rem; }
  :global(.ss-icon) { color: #059669; }
  .success-state h1 { font-size: 1.375rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .success-state > p { font-size: .875rem; color: #64748b; margin: 0; line-height: 1.6; }
  .ss-note { font-size: .8125rem !important; color: #94a3b8 !important; }
  .success-state a { color: #059669; font-weight: 600; }
  .ss-btn { padding: .625rem 1.75rem; margin-top: .5rem; }
  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>

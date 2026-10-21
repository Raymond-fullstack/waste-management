<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  onMount(() => goto('/auth/login'));
</script>
<svelte:head><title>WasteLink Uganda</title></svelte:head>
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc">
  <p style="color:#64748b;font-size:.9375rem">Redirecting...</p>
</div>

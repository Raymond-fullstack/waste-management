<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  export let data;
  // Server already redirects, but just in case
  onMount(() => {
    if (data?.user) {
      const routes: Record<string,string> = { HOUSEHOLD:'/dashboard/household', COLLECTOR:'/dashboard/collector', RECYCLER:'/dashboard/recycler', ADMIN:'/dashboard/admin' };
      goto(routes[data.user.role] ?? '/auth/login');
    }
  });
</script>
<svelte:head><title>Dashboard — WasteLink</title></svelte:head>
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc">
  <p style="color:#64748b;font-size:.9375rem">Redirecting...</p>
</div>

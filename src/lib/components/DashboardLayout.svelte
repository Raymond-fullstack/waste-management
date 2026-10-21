<!-- src/lib/components/DashboardLayout.svelte -->
<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import Navbar from './Navbar.svelte';
  export let role: string;
  export let userName: string;
  export let avatarUrl: string | null = null;
  export let title: string = 'Dashboard';
  export let notificationCount: number = 0;
  export let pendingRequests: number = 0;
  export let showBecomeCollector: boolean = true;
  let sidebarOpen = false;
</script>

<div class="dash-shell">
  <Sidebar {role} {userName} {avatarUrl} {pendingRequests} {showBecomeCollector} bind:isOpen={sidebarOpen}/>
  <div class="dash-body">
    <Navbar {title} {userName} {avatarUrl} {notificationCount} bind:sidebarOpen/>
    <main class="dash-main"><slot/></main>
  </div>
</div>

<style>
  .dash-shell { display:flex; height:100vh; overflow:hidden; }
  .dash-body { flex:1; margin-left:var(--sidebar-width,260px); display:flex; flex-direction:column; min-width:0; height:100vh; overflow:hidden; }
  @media(max-width:768px){ .dash-body { margin-left:0; } }
  .dash-main { flex:1; overflow-y:auto; overflow-x:hidden; padding:1.75rem 2rem; background:#f8fafc; }
  @media(max-width:640px){ .dash-main { padding:1rem; } }
</style>

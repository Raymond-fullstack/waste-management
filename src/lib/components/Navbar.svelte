<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
  import { Bell, Menu } from 'lucide-svelte';

  export let title: string = 'Dashboard';
  export let userName: string = '';
  export let avatarUrl: string | null = null;
  export let notificationCount: number = 0;
  export let sidebarOpen: boolean = false;
</script>

<header class="navbar">
  <div class="nb-left">
    <button class="menu-btn" on:click={() => sidebarOpen = !sidebarOpen} aria-label="Toggle menu">
      <Menu size={20}/>
    </button>
    <h1 class="nb-title">{title}</h1>
  </div>
  <div class="nb-right">
    <a href="/dashboard/notifications" class="notif-btn" aria-label="Notifications">
      <Bell size={18} strokeWidth={1.8}/>
      {#if notificationCount > 0}
        <span class="notif-count">{notificationCount > 99 ? '99+' : notificationCount}</span>
      {/if}
    </a>
    <a href="/dashboard/settings" class="nb-avatar-link" aria-label="Settings">
      {#if avatarUrl}
        <img src={avatarUrl} alt={userName} class="nb-avatar-img"/>
      {:else}
        <div class="nb-avatar">{userName.charAt(0).toUpperCase()}</div>
      {/if}
    </a>
  </div>
</header>

<style>
  .navbar {
    height: 60px; flex-shrink: 0;
    background: white; border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.5rem; gap: 1rem;
  }
  .nb-left { display: flex; align-items: center; gap: .875rem; }
  .menu-btn {
    display: none; background: none; border: none; color: #475569;
    cursor: pointer; padding: .25rem; border-radius: 6px;
  }
  .menu-btn:hover { background: #f1f5f9; }
  @media (max-width: 768px) { .menu-btn { display: flex; align-items: center; justify-content: center; } }
  .nb-title { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -.02em; }
  .nb-right { display: flex; align-items: center; gap: .75rem; }
  .notif-btn {
    position: relative; display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px; color: #475569;
    text-decoration: none; transition: background .15s;
  }
  .notif-btn:hover { background: #f1f5f9; color: #0f172a; }
  .notif-count {
    position: absolute; top: -3px; right: -3px;
    background: #ef4444; color: white; font-size: .5625rem; font-weight: 700;
    padding: .1rem .3rem; border-radius: 999px; min-width: 16px; text-align: center;
  }
  .nb-avatar {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, #059669, #0d9488);
    color: white; font-weight: 700; font-size: .875rem;
    display: flex; align-items: center; justify-content: center;
  }
  .nb-avatar-link { display: flex; text-decoration: none; }
  .nb-avatar-img {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    object-fit: cover;
  }
</style>

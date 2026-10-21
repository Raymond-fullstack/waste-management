<!-- src/lib/components/Sidebar.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Recycle, Home, Trash2, ClipboardList, TrendingUp, Bell, Truck, Package, DollarSign, BarChart2, Users, Map, AlertTriangle, FileCheck, Plus, Building2, LayoutDashboard, ChevronRight, LogOut, Settings } from 'lucide-svelte';

  export let role: string = 'HOUSEHOLD';
  export let userName: string = '';
  export let avatarUrl: string | null = null;
  export let isOpen: boolean = false;
  export let pendingRequests: number = 0;
  export let showBecomeCollector: boolean = true;

  type NavItem = { label: string; href: string; icon: any; badge?: number | string; hidden?: boolean; };
  type NavSection = { title?: string; items: NavItem[]; };

  const navSections: Record<string, NavSection[]> = {
    HOUSEHOLD: [{ items: [
      { label: 'Overview',          href: '/dashboard/household',                   icon: Home },
      { label: 'Request Pickup',    href: '/dashboard/household/request',           icon: Trash2 },
      { label: 'My Pickups',        href: '/dashboard/household/pickups',           icon: ClipboardList },
      { label: 'Recycling Impact',  href: '/dashboard/household/impact',            icon: TrendingUp },
      { label: 'Notifications',     href: '/dashboard/household/notifications',     icon: Bell },
      { label: 'Become a Collector',href: '/dashboard/household/become-collector',  icon: Truck },
    ]}],
    COLLECTOR: [{ items: [
      { label: 'Overview',          href: '/dashboard/collector',                   icon: Home },
      { label: 'Available Pickups', href: '/dashboard/collector/available',         icon: Map },
      { label: 'My Assignments',    href: '/dashboard/collector/assignments',       icon: ClipboardList },
      { label: 'Earnings',          href: '/dashboard/collector/earnings',          icon: DollarSign },
      { label: 'Notifications',     href: '/dashboard/collector/notifications',     icon: Bell },
    ]}],
    RECYCLER: [{ items: [
      { label: 'Overview',          href: '/dashboard/recycler',                    icon: Home },
      { label: 'Available Waste',   href: '/dashboard/recycler/available',          icon: Package },
      { label: 'My Bids',           href: '/dashboard/recycler/bids',               icon: DollarSign },
      { label: 'Supply History',    href: '/dashboard/recycler/history',            icon: BarChart2 },
      { label: 'Notifications',     href: '/dashboard/recycler/notifications',      icon: Bell },
    ]}],
    ADMIN: [
      { title: 'Overview', items: [
        { label: 'Dashboard',         href: '/dashboard/admin',                       icon: LayoutDashboard },
        { label: 'Notifications',     href: '/dashboard/admin/notifications',         icon: Bell },
      ]},
      { title: 'Operations', items: [
        { label: 'All Pickups',       href: '/dashboard/admin/pickups',               icon: Trash2 },
        { label: 'Landfill',          href: '/dashboard/admin/landfill',              icon: AlertTriangle },
        { label: 'Reports',           href: '/dashboard/admin/reports',               icon: BarChart2 },
      ]},
      { title: 'People', items: [
        { label: 'Applications',      href: '/dashboard/admin/collector-requests',    icon: FileCheck, badge: 0 },
        { label: 'Collectors',        href: '/dashboard/admin/collectors',            icon: Truck },
        { label: 'Households',        href: '/dashboard/admin/households',            icon: Users },
        { label: 'Recyclers',         href: '/dashboard/admin/recyclers',             icon: Recycle },
        { label: 'Add Recycler',      href: '/dashboard/admin/add-recycler',          icon: Plus },
      ]},
      { title: 'Config', items: [
        { label: 'Zones & Districts', href: '/dashboard/admin/zones',                 icon: Map },
        { label: 'Waste Pricing',     href: '/dashboard/admin/pricing',               icon: DollarSign },
      ]},
    ],
  };

  const roleColors: Record<string,string> = { HOUSEHOLD:'#10b981', COLLECTOR:'#3b82f6', RECYCLER:'#8b5cf6', ADMIN:'#f59e0b' };
  const roleLabels: Record<string,string> = { HOUSEHOLD:'Household', COLLECTOR:'Collector', RECYCLER:'Recycler Company', ADMIN:'City Admin' };

  $: sections = navSections[role] ?? [];
  $: currentPath = $page.url.pathname;

  $: if (role === 'ADMIN' && pendingRequests > 0) {
    const peopleSec = navSections['ADMIN']?.find(s => s.title === 'People');
    const appsItem = peopleSec?.items?.find(i => i.href === '/dashboard/admin/collector-requests');
    if (appsItem) appsItem.badge = pendingRequests;
  }

  $: isActive = (href: string) => currentPath === href ||
    (href !== `/dashboard/${role.toLowerCase()}` && currentPath.startsWith(href));

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/auth/login');
  }
</script>

{#if isOpen}
  <button class="overlay" on:click={() => isOpen = false} aria-label="Close"></button>
{/if}

<aside class="sidebar" class:open={isOpen}>
  <div class="brand">
    <div class="brand-icon"><Recycle size={20} strokeWidth={2.5}/></div>
    <div><span class="brand-name">WasteLink</span><span class="brand-sub">Uganda</span></div>
  </div>

  <div class="role-badge" style="--rc:{roleColors[role]}">
    <div class="role-dot"></div>
    <span>{roleLabels[role]}</span>
  </div>

  <nav class="nav" aria-label="Main navigation">
    {#each sections as section}
      {#if section.title}
        <div class="nav-section-title">{section.title}</div>
      {/if}
      {#each section.items as item}
        {#if !item.hidden && !(item.href === '/dashboard/household/become-collector' && !showBecomeCollector)}
          <a href={item.href} class="nav-item" class:active={isActive(item.href)}
            on:click={() => isOpen = false} aria-current={isActive(item.href) ? 'page' : undefined}>
            <span class="nav-icon"><svelte:component this={item.icon} size={17} strokeWidth={1.8}/></span>
            <span class="nav-label">{item.label}</span>
            {#if item.badge && Number(item.badge) > 0}
              <span class="nav-badge">{Number(item.badge) > 99 ? '99+' : item.badge}</span>
            {/if}
            {#if isActive(item.href)}<ChevronRight size={13} class="nav-arrow"/>{/if}
          </a>
        {/if}
      {/each}
    {/each}
  </nav>

  <div class="sidebar-footer">
    <a href="/dashboard/settings" class="user-row">
      {#if avatarUrl}
        <img src={avatarUrl} alt={userName} class="user-av-img"/>
      {:else}
        <div class="user-av">{userName.charAt(0).toUpperCase()}</div>
      {/if}
      <div class="user-info">
        <span class="user-name">{userName}</span>
        <span class="user-role">{roleLabels[role]}</span>
      </div>
      <Settings size={14} class="settings-icon"/>
    </a>
    <button class="logout-btn" on:click={logout}><LogOut size={15}/><span>Sign Out</span></button>
  </div>
</aside>

<style>
  .overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:30;border:none;cursor:pointer;display:none; }
  @media(max-width:768px){ .overlay { display:block; } }

  .sidebar {
    width:var(--sidebar-width,260px); height:100vh; position:fixed; top:0; left:0; z-index:40;
    background:#0f172a; border-right:1px solid rgba(255,255,255,.06);
    display:flex; flex-direction:column; transition:transform .3s ease; overflow:hidden;
  }
  @media(max-width:768px){ .sidebar { transform:translateX(-100%); } .sidebar.open { transform:translateX(0); } }

  .brand { display:flex;align-items:center;gap:.75rem;padding:1.25rem 1.25rem .875rem;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0; }
  .brand-icon { width:38px;height:38px;border-radius:9px;background:linear-gradient(135deg,#059669,#0d9488);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0; }
  .brand-name { display:block;font-family:var(--font-display);font-size:1rem;font-weight:700;color:white;letter-spacing:-.02em;line-height:1.1; }
  .brand-sub  { display:block;font-size:.625rem;color:#64748b;text-transform:uppercase;letter-spacing:.08em; }

  .role-badge { display:flex;align-items:center;gap:.5rem;margin:.625rem 1rem;padding:.375rem .75rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:8px;font-size:.75rem;color:#94a3b8;font-weight:500;flex-shrink:0; }
  .role-dot { width:7px;height:7px;border-radius:50%;background:var(--rc);animation:pulse-green 2s infinite;flex-shrink:0; }

  .nav { flex:1;overflow-y:auto;overflow-x:hidden;padding:.5rem .75rem;display:flex;flex-direction:column;gap:1px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent; }
  .nav::-webkit-scrollbar { width:4px; }
  .nav::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1);border-radius:2px; }

  .nav-section-title { font-size:.6rem;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.1em;padding:.875rem .75rem .3rem;flex-shrink:0; }

  .nav-item { display:flex;align-items:center;gap:.625rem;padding:.55rem .75rem;border-radius:7px;color:#94a3b8;text-decoration:none;font-size:.8125rem;font-weight:500;transition:all .15s; }
  .nav-item:hover { background:rgba(255,255,255,.06);color:#e2e8f0; }
  .nav-item.active { background:rgba(5,150,105,.15);color:#34d399; }
  .nav-icon { width:26px;height:26px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .nav-label { flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .nav-badge { background:#ef4444;color:white;font-size:.5625rem;font-weight:700;padding:.1rem .375rem;border-radius:999px;flex-shrink:0; }
  :global(.nav-arrow) { color:#34d399;flex-shrink:0; }

  .sidebar-footer { padding:.75rem;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:.375rem;flex-shrink:0; }
  .user-row { display:flex;align-items:center;gap:.625rem;padding:.5rem .625rem;border-radius:7px;text-decoration:none;transition:background .15s; }
  .user-row:hover { background:rgba(255,255,255,.05); }
  .user-av { width:32px;height:32px;border-radius:7px;background:linear-gradient(135deg,#059669,#0d9488);color:white;font-weight:700;font-size:.875rem;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .user-av-img { width:32px;height:32px;border-radius:7px;object-fit:cover;flex-shrink:0; }
  .user-info { flex:1;overflow:hidden; }
  .user-name { display:block;font-size:.8125rem;font-weight:600;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .user-role { display:block;font-size:.6875rem;color:#64748b; }
  :global(.settings-icon) { color:#475569;flex-shrink:0; }
  .logout-btn { display:flex;align-items:center;gap:.5rem;width:100%;padding:.55rem .75rem;border-radius:7px;background:none;border:none;color:#64748b;font-size:.8125rem;font-weight:500;cursor:pointer;transition:all .15s;font-family:var(--font-body); }
  .logout-btn:hover { background:rgba(239,68,68,.1);color:#ef4444; }
</style>

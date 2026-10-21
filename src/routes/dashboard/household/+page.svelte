<!-- src/routes/dashboard/household/+page.svelte -->
<script lang="ts">
  import { Trash2, TrendingUp, CheckCircle, Clock, Package, ArrowRight, Bell } from 'lucide-svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import { formatWeight, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ stats, recentPickups, profile, showBecomeCollector } = data);

  const wasteColors: Record<string, string> = {
    ORGANIC: '#84cc16', PLASTIC: '#3b82f6', METAL: '#6b7280',
    GLASS: '#06b6d4', PAPER: '#f59e0b', HAZARDOUS: '#ef4444',
    ELECTRONIC: '#8b5cf6', MIXED: '#64748b',
  };
</script>

<svelte:head><title>Household Dashboard — WasteLink</title></svelte:head>

<div class="stagger-children">
  <!-- Welcome Banner -->
  <div class="welcome-banner">
    <div class="wb-left">
      <h2>Welcome back, {data.user.name.split(' ')[0]}! 👋</h2>
      <p>{profile?.address ?? 'Kampala, Uganda'}</p>
    </div>
    <a href="/dashboard/household/request" class="btn-primary request-btn">
      <Trash2 size={15}/> Request Pickup
    </a>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <StatCard title="Total Pickups"   value={stats.total}    subtitle="All time"      icon={Package}      iconColor="#3b82f6" iconBg="#eff6ff"/>
    <StatCard title="Active"          value={stats.active}   subtitle="In progress"   icon={Clock}        iconColor="#f59e0b" iconBg="#fffbeb"/>
    <StatCard title="Completed"       value={stats.completed} subtitle="Delivered"    icon={CheckCircle}  iconColor="#059669" iconBg="#ecfdf5"/>
    <StatCard title="Waste Diverted"  value={formatWeight(stats.totalWasteKg)} subtitle="From landfill" icon={TrendingUp} iconColor="#8b5cf6" iconBg="#f5f3ff"/>
  </div>

  <!-- Quick Actions -->
  <div class="quick-grid">
    <a href="/dashboard/household/request" class="qa-card primary">
      <Trash2 size={24} strokeWidth={1.5}/>
      <span>Request Pickup</span>
      <p>Schedule a waste collection</p>
    </a>
    <a href="/dashboard/household/pickups" class="qa-card">
      <Package size={24} strokeWidth={1.5}/>
      <span>My Pickups</span>
      <p>Track all your requests</p>
    </a>
    <a href="/dashboard/household/impact" class="qa-card">
      <TrendingUp size={24} strokeWidth={1.5}/>
      <span>My Impact</span>
      <p>See your recycling stats</p>
    </a>
    <a href="/dashboard/household/notifications" class="qa-card">
      <Bell size={24} strokeWidth={1.5}/>
      <span>Notifications</span>
      {#if data.notificationCount > 0}
        <p class="notif-pill">{data.notificationCount} unread</p>
      {:else}
        <p>Updates & alerts</p>
      {/if}
    </a>
    {#if showBecomeCollector}
      <a href="/dashboard/household/become-collector" class="qa-card collector">
        <span class="qac-emoji">🚛</span>
        <span>Become a Collector</span>
        <p>Earn by collecting waste</p>
      </a>
    {/if}
  </div>

  <!-- Recent Pickups -->
  {#if recentPickups.length > 0}
    <div class="dash-card">
      <div class="dc-header">
        <h3>Recent Pickups</h3>
        <a href="/dashboard/household/pickups" class="dc-link">View all <ArrowRight size={13}/></a>
      </div>
      <div class="pickup-list">
        {#each recentPickups as p}
          <div class="pickup-row">
            <div class="pr-dot" style="background:{wasteColors[p.wasteType] ?? '#64748b'}"></div>
            <div class="pr-info">
              <span class="pr-type">{p.category.name}</span>
              <span class="pr-weight">{formatWeight(p.estimatedWeight)}</span>
            </div>
            <StatusBadge status={p.status}/>
            <span class="pr-time">{timeAgo(p.createdAt)}</span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty-card">
      <Trash2 size={40} strokeWidth={1}/>
      <h3>No pickups yet</h3>
      <p>Schedule your first waste pickup to get started.</p>
      <a href="/dashboard/household/request" class="btn-primary">Request First Pickup</a>
    </div>
  {/if}
</div>

<style>
  .welcome-banner { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; background: linear-gradient(135deg, #065f46, #059669); border-radius: 1rem; color: white; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .wb-left h2 { font-size: 1.125rem; font-weight: 800; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .wb-left p  { font-size: .875rem; color: rgba(255,255,255,.8); margin: 0; }
  .request-btn { background: white; color: #059669; font-weight: 700; }
  .request-btn:hover { background: #f0fdf4; transform: none; }

  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:900px){ .stats-row { grid-template-columns: repeat(2,1fr); } }
  @media(max-width:480px){ .stats-row { grid-template-columns: 1fr; } }

  .quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .875rem; margin-bottom: 1.5rem; }
  .qa-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .375rem; padding: 1.25rem 1rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 1rem; text-decoration: none; color: #334155; text-align: center; transition: all .2s; }
  .qa-card:hover { border-color: #059669; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(5,150,105,.1); }
  .qa-card.primary { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
  .qa-card.collector { background: #fffbeb; border-color: #fcd34d; }
  .qa-card span:nth-child(2) { font-size: .875rem; font-weight: 700; }
  .qa-card p { font-size: .75rem; color: #94a3b8; margin: 0; }
  .notif-pill { background: #ef4444; color: white !important; padding: .1rem .5rem; border-radius: 999px; font-size: .6875rem !important; font-weight: 700; }
  .qac-emoji { font-size: 1.5rem; }

  .dash-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .dc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .dc-header h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dc-link { display: flex; align-items: center; gap: .25rem; font-size: .8125rem; color: #059669; font-weight: 600; text-decoration: none; }

  .pickup-list { display: flex; flex-direction: column; gap: .625rem; }
  .pickup-row { display: flex; align-items: center; gap: .75rem; padding: .75rem; background: #f8fafc; border-radius: .75rem; }
  .pr-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .pr-info { flex: 1; }
  .pr-type { display: block; font-size: .875rem; font-weight: 600; color: #1e293b; }
  .pr-weight { display: block; font-size: .75rem; color: #94a3b8; }
  .pr-time { font-size: .75rem; color: #94a3b8; white-space: nowrap; }

  .empty-card { display: flex; flex-direction: column; align-items: center; gap: .875rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; text-align: center; color: #94a3b8; }
  .empty-card h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-card p  { font-size: .875rem; margin: 0; }
</style>

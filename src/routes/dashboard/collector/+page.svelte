<!-- src/routes/dashboard/collector/+page.svelte -->
<script lang="ts">
  import { Truck, DollarSign, Package, Star, CheckCircle, Map, ArrowRight } from 'lucide-svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, formatCurrency, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ stats, availablePickups, myAssignments, profile } = data);
</script>

<svelte:head><title>Collector Dashboard — WasteLink</title></svelte:head>

<div class="stagger-children">
  <!-- Header -->
  <div class="coll-header">
    <div>
      <h2>Collector Dashboard</h2>
      {#if profile}
        <p>License: <strong>{profile.licenseNumber}</strong> · Zone: <strong>{profile.zone?.name ?? 'Not assigned'}</strong></p>
      {/if}
    </div>
    <div class="availability-toggle">
      <span class="avail-label">Available</span>
      <div class="avail-dot" class:active={profile?.isAvailable}></div>
    </div>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <StatCard title="Available Pickups" value={stats.available}  subtitle="Pending in your area" icon={Package}      iconColor="#3b82f6" iconBg="#eff6ff"/>
    <StatCard title="Active Jobs"        value={stats.active}    subtitle="In progress"          icon={Truck}        iconColor="#f59e0b" iconBg="#fffbeb"/>
    <StatCard title="Total Deliveries"   value={stats.totalDeliveries} subtitle="Completed"     icon={CheckCircle}  iconColor="#059669" iconBg="#ecfdf5"/>
    <StatCard title="This Month"         value={formatCurrency(stats.monthlyEarnings)} subtitle="Earnings" icon={DollarSign} iconColor="#8b5cf6" iconBg="#f5f3ff"/>
  </div>

  <div class="main-grid">
    <!-- Available Pickups -->
    <div class="dash-card">
      <div class="dc-header">
        <h3>Available Pickups</h3>
        <a href="/dashboard/collector/available" class="dc-link">View all <ArrowRight size={13}/></a>
      </div>
      {#if availablePickups.length === 0}
        <div class="empty-inline">
          <Map size={32} strokeWidth={1}/>
          <p>No pickups available right now. Check back soon.</p>
        </div>
      {:else}
        <div class="pickup-list">
          {#each availablePickups.slice(0, 5) as p}
            <div class="pickup-row">
              <div class="pr-info">
                <span class="pr-type">{p.category.name}</span>
                <span class="pr-addr">{p.address?.slice(0, 40) ?? ''}...</span>
                <span class="pr-weight">{formatWeight(p.estimatedWeight)}</span>
              </div>
              <a href="/dashboard/collector/available" class="accept-btn">Accept</a>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- My Assignments -->
    <div class="dash-card">
      <div class="dc-header">
        <h3>My Assignments</h3>
        <a href="/dashboard/collector/assignments" class="dc-link">View all <ArrowRight size={13}/></a>
      </div>
      {#if myAssignments.length === 0}
        <div class="empty-inline">
          <Truck size={32} strokeWidth={1}/>
          <p>No active assignments. Accept a pickup to get started.</p>
        </div>
      {:else}
        <div class="assignment-list">
          {#each myAssignments as a}
            <div class="asgn-row">
              <div class="asgn-info">
                <span class="asgn-type">{a.pickup.category.name}</span>
                <span class="asgn-hh">{a.pickup.household.name}</span>
              </div>
              <StatusBadge status={a.pickup.status}/>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Earnings Summary -->
  <div class="earnings-row">
    <div class="earn-card">
      <DollarSign size={20}/>
      <div>
        <span class="ec-val">{formatCurrency(stats.totalEarnings)}</span>
        <span class="ec-lab">Total Earnings</span>
      </div>
    </div>
    <div class="earn-card">
      <Star size={20}/>
      <div>
        <span class="ec-val">{stats.rating.toFixed(1)} ★</span>
        <span class="ec-lab">Average Rating</span>
      </div>
    </div>
    <a href="/dashboard/collector/earnings" class="earn-link">View Earnings →</a>
  </div>
</div>

<style>
  .coll-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .coll-header h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .coll-header p  { font-size: .8125rem; color: #64748b; margin: 0; }

  .availability-toggle { display: flex; align-items: center; gap: .5rem; }
  .avail-label { font-size: .8125rem; color: #64748b; font-weight: 500; }
  .avail-dot { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; }
  .avail-dot.active { background: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,.2); }

  .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:900px){ .stats-row { grid-template-columns: repeat(2,1fr); } }

  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
  @media(max-width:768px){ .main-grid { grid-template-columns: 1fr; } }

  .dash-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .dc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .dc-header h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dc-link { display: flex; align-items: center; gap: .25rem; font-size: .8125rem; color: #3b82f6; font-weight: 600; text-decoration: none; }

  .empty-inline { display: flex; flex-direction: column; align-items: center; gap: .625rem; padding: 2rem; color: #94a3b8; text-align: center; }
  .empty-inline p { font-size: .8125rem; margin: 0; max-width: 240px; line-height: 1.5; }

  .pickup-list, .assignment-list { display: flex; flex-direction: column; gap: .625rem; }
  .pickup-row { display: flex; align-items: center; gap: .75rem; padding: .75rem; background: #f8fafc; border-radius: .75rem; }
  .pr-info { flex: 1; }
  .pr-type { display: block; font-size: .875rem; font-weight: 700; color: #1e293b; }
  .pr-addr { display: block; font-size: .75rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pr-weight { display: block; font-size: .6875rem; color: #94a3b8; }
  .accept-btn { padding: .3rem .75rem; background: #3b82f6; color: white; border-radius: 7px; font-size: .75rem; font-weight: 700; text-decoration: none; white-space: nowrap; }

  .asgn-row { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .75rem; background: #f8fafc; border-radius: .75rem; }
  .asgn-type { display: block; font-size: .875rem; font-weight: 700; color: #1e293b; }
  .asgn-hh   { display: block; font-size: .75rem; color: #64748b; }

  .earnings-row { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; flex-wrap: wrap; }
  .earn-card { display: flex; align-items: center; gap: .75rem; color: #059669; padding-right: 1.25rem; border-right: 1px solid #e2e8f0; }
  .earn-card:last-of-type { border-right: none; }
  .ec-val { display: block; font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; }
  .ec-lab { display: block; font-size: .6875rem; color: #64748b; }
  .earn-link { margin-left: auto; font-size: .875rem; font-weight: 600; color: #059669; text-decoration: none; }
</style>

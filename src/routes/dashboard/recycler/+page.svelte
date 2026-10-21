<!-- src/routes/dashboard/recycler/+page.svelte -->
<script lang="ts">
  import { Package, DollarSign, CheckCircle, TrendingUp, ArrowRight } from 'lucide-svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, formatCurrency, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ stats, availableWaste, myBids, profile } = data);

  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280',
    GLASS:'#06b6d4', PAPER:'#f59e0b', HAZARDOUS:'#ef4444',
    ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };
</script>

<svelte:head><title>Recycler Dashboard — WasteLink</title></svelte:head>

<div class="stagger-children">
  <div class="rec-header">
    <div>
      <h2>{profile?.companyName ?? data.user.name}</h2>
      <p>License: <strong>{profile?.businessLicense ?? '—'}</strong></p>
    </div>
  </div>

  <div class="stats-row">
    <StatCard title="Available Waste"  value={stats.availableWaste}  subtitle="COLLECTED lots open for bidding" icon={Package}     iconColor="#3b82f6" iconBg="#eff6ff"/>
    <StatCard title="Pending Bids"     value={stats.pendingBids}     subtitle="Awaiting response"               icon={DollarSign}  iconColor="#f59e0b" iconBg="#fffbeb"/>
    <StatCard title="Accepted Bids"    value={stats.acceptedBids}    subtitle="Contracts won"                   icon={CheckCircle} iconColor="#059669" iconBg="#ecfdf5"/>
    <StatCard title="Total Processed"  value={formatWeight(stats.totalProcessed)} subtitle="All time"           icon={TrendingUp}  iconColor="#8b5cf6" iconBg="#f5f3ff"/>
  </div>

  <div class="main-grid">
    <!-- Available Waste -->
    <div class="dash-card">
      <div class="dc-header">
        <h3>Available Waste Lots</h3>
        <a href="/dashboard/recycler/available" class="dc-link">View all <ArrowRight size={13}/></a>
      </div>
      {#if availableWaste.length === 0}
        <div class="empty-inline">
          <Package size={32} strokeWidth={1}/>
          <p>No waste lots available. They appear when collectors mark pickups as Collected.</p>
        </div>
      {:else}
        <div class="waste-list">
          {#each availableWaste.slice(0,5) as w}
            {@const myBid = w.bids?.[0]}
            <div class="waste-row">
              <div class="wr-dot" style="background:{wasteColors[w.wasteType]??'#64748b'}"></div>
              <div class="wr-info">
                <span class="wr-type">{w.category?.name ?? w.wasteType}</span>
                <span class="wr-weight">{formatWeight(w.actualWeight ?? w.estimatedWeight)}</span>
              </div>
              {#if myBid}
                <StatusBadge status={myBid.status}/>
              {:else}
                <a href="/dashboard/recycler/available" class="bid-btn">Place Bid</a>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- My Recent Bids -->
    <div class="dash-card">
      <div class="dc-header">
        <h3>My Recent Bids</h3>
        <a href="/dashboard/recycler/bids" class="dc-link">View all <ArrowRight size={13}/></a>
      </div>
      {#if myBids.length === 0}
        <div class="empty-inline">
          <DollarSign size={32} strokeWidth={1}/>
          <p>No bids placed yet. Browse available waste to start bidding.</p>
        </div>
      {:else}
        <div class="bids-list">
          {#each myBids.slice(0,5) as b}
            <div class="bid-row">
              <div class="br-info">
                <span class="br-type">{b.pickup?.category?.name ?? b.pickup?.wasteType}</span>
                <span class="br-offer">{formatCurrency(b.totalOffer)}</span>
              </div>
              <StatusBadge status={b.status}/>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .rec-header { margin-bottom: 1.5rem; }
  .rec-header h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0 0 .2rem; letter-spacing: -.03em; }
  .rec-header p  { font-size: .8125rem; color: #64748b; margin: 0; }

  .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:900px){ .stats-row { grid-template-columns: repeat(2,1fr); } }

  .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  @media(max-width:768px){ .main-grid { grid-template-columns: 1fr; } }

  .dash-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .dc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .dc-header h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0; }
  .dc-link { display: flex; align-items: center; gap: .25rem; font-size: .8125rem; color: #8b5cf6; font-weight: 600; text-decoration: none; }

  .empty-inline { display: flex; flex-direction: column; align-items: center; gap: .625rem; padding: 2rem; color: #94a3b8; text-align: center; }
  .empty-inline p { font-size: .8125rem; margin: 0; max-width: 240px; line-height: 1.5; }

  .waste-list, .bids-list { display: flex; flex-direction: column; gap: .625rem; }
  .waste-row, .bid-row { display: flex; align-items: center; gap: .75rem; padding: .75rem; background: #f8fafc; border-radius: .75rem; }
  .wr-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .wr-info { flex: 1; }
  .wr-type   { display: block; font-size: .875rem; font-weight: 700; color: #1e293b; }
  .wr-weight { display: block; font-size: .75rem; color: #64748b; }
  .bid-btn { padding: .3rem .75rem; background: #8b5cf6; color: white; border-radius: 7px; font-size: .75rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
  .br-info { flex: 1; }
  .br-type  { display: block; font-size: .875rem; font-weight: 700; color: #1e293b; }
  .br-offer { display: block; font-size: .75rem; color: #8b5cf6; font-weight: 700; }
</style>

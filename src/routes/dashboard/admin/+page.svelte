<!-- src/routes/dashboard/admin/+page.svelte -->
<script lang="ts">
  import { Users, Truck, Recycle, Trash2, CheckCircle, AlertTriangle, BarChart2, TrendingUp, FileCheck } from 'lucide-svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatWeight, timeAgo } from '$lib/utils/api';

  export let data;
  $: ({ stats, landfill, recentPickups, pendingCollectorRequests, wasteBreakdown, dailyData } = data);

  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280', GLASS:'#06b6d4',
    PAPER:'#f59e0b', HAZARDOUS:'#ef4444', ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };
  $: maxCount = Math.max(...(dailyData?.map((d: any) => d.count) ?? []), 1);
</script>

<svelte:head><title>Admin Dashboard — WasteLink</title></svelte:head>

<div class="stagger-children">
  {#if landfill?.isAlert}
    <div class="alert-strip" class:critical={landfill.loadPercent >= 95}>
      <AlertTriangle size={18}/>
      <div>
        <strong>{landfill.loadPercent >= 95 ? '🚨 CRITICAL' : '⚠️ WARNING'}: Kiteezi at {landfill.loadPercent}% capacity</strong>
        <span>Increase diversion efforts immediately.</span>
      </div>
      <a href="/dashboard/admin/landfill" class="alert-cta">Monitor →</a>
    </div>
  {/if}

  <div class="dash-header">
    <div>
      <h2>City Dashboard</h2>
      <p>{new Date().toLocaleDateString('en-UG', { dateStyle: 'full' })}</p>
    </div>
    {#if (stats?.pendingRequests ?? 0) > 0}
      <a href="/dashboard/admin/collector-requests" class="pending-chip">
        <FileCheck size={12}/> {stats.pendingRequests} application{stats.pendingRequests > 1 ? 's' : ''} pending
      </a>
    {/if}
  </div>

  <div class="stats-4">
    <StatCard title="Households"        value={(stats?.totalHouseholds ?? 0).toLocaleString()} subtitle="Registered"           icon={Users}      iconColor="#059669" iconBg="#ecfdf5"/>
    <StatCard title="Active Collectors" value={stats?.activeCollectors ?? 0} subtitle="{stats?.pendingRequests ?? 0} apps pending" icon={Truck}  iconColor="#3b82f6" iconBg="#eff6ff"/>
    <StatCard title="Recyclers"         value={stats?.totalRecyclers ?? 0}   subtitle="Partner companies"    icon={Recycle}    iconColor="#8b5cf6" iconBg="#f5f3ff"/>
    <StatCard title="Today's Pickups"   value={stats?.todayPickups ?? 0}     subtitle="Requests created"     icon={Trash2}     iconColor="#f59e0b" iconBg="#fffbeb"/>
  </div>

  <div class="stats-3">
    <StatCard title="Total Pickups"  value={(stats?.totalPickups ?? 0).toLocaleString()}    subtitle="All time"          icon={BarChart2}  iconColor="#0d9488" iconBg="#f0fdfa"/>
    <StatCard title="Completed"      value={(stats?.completedPickups ?? 0).toLocaleString()} subtitle="{stats?.totalPickups > 0 ? Math.round((stats?.completedPickups ?? 0)/(stats?.totalPickups ?? 1)*100) : 0}% success" icon={CheckCircle} iconColor="#059669" iconBg="#ecfdf5"/>
    <StatCard title="Waste Diverted" value={formatWeight(stats?.totalWeight ?? 0)}          subtitle="From landfill"     icon={TrendingUp} iconColor="#059669" iconBg="#ecfdf5"/>
  </div>

  <div class="main-grid">
    <div class="col-left">
      <div class="dash-card">
        <div class="cc-hdr"><h3>Weekly Activity</h3></div>
        <div class="bar-chart">
          {#each (dailyData ?? []) as d}
            <div class="bc-col">
              <span class="bc-val">{d.count}</span>
              <div class="bc-wrap"><div class="bc-bar" style="height:{(d.count / maxCount) * 100}%"></div></div>
              <span class="bc-day">{d.date}</span>
            </div>
          {/each}
        </div>
      </div>

      {#if wasteBreakdown && wasteBreakdown.length > 0}
        <div class="dash-card">
          <div class="cc-hdr"><h3>Waste Breakdown</h3></div>
          <div class="wb-list">
            {#each wasteBreakdown as w}
              {@const totalC = wasteBreakdown.reduce((s: number, x: any) => s + x.count, 0)}
              {@const pct = totalC > 0 ? Math.round(w.count / totalC * 100) : 0}
              <div class="wb-row">
                <div class="wb-left"><div class="wb-dot" style="background:{wasteColors[w.type]??'#64748b'}"></div><span class="wb-type">{w.type}</span></div>
                <div class="wb-bar-wrap"><div class="wb-bar" style="width:{pct}%;background:{wasteColors[w.type]??'#64748b'}"></div></div>
                <div class="wb-right"><span class="wb-cnt">{w.count}</span><span class="wb-pct">{pct}%</span></div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if landfill}
        <div class="dash-card" class:alert-card={landfill.isAlert}>
          <div class="cc-hdr"><h3>{landfill.name}</h3><a href="/dashboard/admin/landfill" class="cc-link">Monitor →</a></div>
          <div class="lf-labels"><span>Capacity Used</span><span class="lf-pct" class:red={landfill.isAlert}>{landfill.loadPercent}%</span></div>
          <div class="lf-bar-wrap"><div class="lf-bar" style="width:{landfill.loadPercent}%" class:bar-warn={landfill.loadPercent>=70} class:bar-crit={landfill.loadPercent>=85}></div></div>
          <div class="lf-stats"><span>{formatWeight(landfill.currentLoad)} / {formatWeight(landfill.maxCapacity)}</span><span class="lf-rem">{formatWeight(landfill.maxCapacity - landfill.currentLoad)} remaining</span></div>
        </div>
      {/if}
    </div>

    <div class="col-right">
      {#if pendingCollectorRequests && pendingCollectorRequests.length > 0}
        <div class="dash-card apps-card">
          <div class="cc-hdr"><h3>⏳ Pending Applications</h3><a href="/dashboard/admin/collector-requests" class="cc-link">All →</a></div>
          <div class="apps-list">
            {#each pendingCollectorRequests as req}
              <div class="app-item">
                <div class="app-av">{req.user?.name?.charAt(0) ?? '?'}</div>
                <div class="app-info">
                  <span class="app-name">{req.user?.name}</span>
                  <span class="app-sub">{req.vehicleType} · {req.vehiclePlate}</span>
                  <span class="app-time">{timeAgo(req.createdAt)}</span>
                </div>
                <a href="/dashboard/admin/collector-requests" class="app-review">Review</a>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="dash-card">
        <div class="cc-hdr"><h3>Recent Pickups</h3><a href="/dashboard/admin/pickups" class="cc-link">All →</a></div>
        {#if !recentPickups || recentPickups.length === 0}
          <p class="no-data">No pickups yet.</p>
        {:else}
          <div class="table-container">
            <table class="data-table">
              <thead><tr><th>Household</th><th>Type</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {#each recentPickups as p}
                  <tr>
                    <td><span class="td-name">{p.household?.name ?? '—'}</span></td>
                    <td><span class="waste-tag" style="background:color-mix(in srgb,{wasteColors[p.wasteType]??'#64748b'} 12%,white);color:{wasteColors[p.wasteType]??'#64748b'}">{p.wasteType}</span></td>
                    <td><StatusBadge status={p.status}/></td>
                    <td class="td-time">{timeAgo(p.createdAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <div class="qa-section">
        <h3>Quick Actions</h3>
        <div class="qa-list">
          <a href="/dashboard/admin/collector-requests" class="qa-item"><FileCheck size={15} class="qa-green"/><span>Collector Applications</span>{#if (stats?.pendingRequests ?? 0) > 0}<span class="qa-badge">{stats.pendingRequests}</span>{/if}</a>
          <a href="/dashboard/admin/add-recycler"       class="qa-item"><Recycle   size={15} class="qa-purple"/><span>Add Recycler Company</span></a>
          <a href="/dashboard/admin/reports"            class="qa-item"><BarChart2  size={15} class="qa-blue"/><span>Generate Report</span></a>
          <a href="/dashboard/admin/landfill"           class="qa-item"><AlertTriangle size={15} class={landfill?.isAlert ? 'qa-red' : 'qa-yellow'}/><span>Landfill Monitor</span></a>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .alert-strip{display:flex;align-items:center;gap:.875rem;padding:1rem 1.25rem;background:#fef2f2;border:1px solid #fca5a5;border-radius:.875rem;color:#991b1b;margin-bottom:1rem;flex-wrap:wrap}
  .alert-strip.critical{border-color:#ef4444;border-width:2px}
  .alert-strip strong{display:block;font-weight:700}
  .alert-strip span{font-size:.8125rem}
  .alert-cta{margin-left:auto;font-size:.8125rem;font-weight:700;color:#dc2626;text-decoration:none;white-space:nowrap}
  .dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem}
  .dash-header h2{font-size:1.125rem;font-weight:800;color:#0f172a;margin:0 0 .2rem;letter-spacing:-.03em}
  .dash-header p{font-size:.8125rem;color:#64748b;margin:0}
  .pending-chip{display:flex;align-items:center;gap:.375rem;padding:.3rem .875rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:999px;font-size:.75rem;font-weight:700;color:#92400e;text-decoration:none}
  .stats-4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1rem}
  .stats-3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
  @media(max-width:1100px){.stats-4{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:768px){.stats-4,.stats-3{grid-template-columns:1fr 1fr}}
  .main-grid{display:grid;grid-template-columns:1fr 360px;gap:1.5rem;align-items:start}
  @media(max-width:1100px){.main-grid{grid-template-columns:1fr}}
  .col-left,.col-right{display:flex;flex-direction:column;gap:1.5rem}
  .dash-card{background:white;border:1px solid #e2e8f0;border-radius:1rem;padding:1.5rem}
  .dash-card.alert-card{border-color:#fca5a5}
  .cc-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
  .cc-hdr h3{font-size:.9375rem;font-weight:700;color:#0f172a;margin:0}
  .cc-link{font-size:.75rem;color:#059669;font-weight:600;text-decoration:none}
  .bar-chart{display:flex;align-items:flex-end;gap:.5rem;height:130px}
  .bc-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:.25rem;height:100%}
  .bc-val{font-size:.625rem;font-weight:700;color:#334155}
  .bc-wrap{flex:1;width:100%;display:flex;align-items:flex-end;background:#f8fafc;border-radius:6px;overflow:hidden}
  .bc-bar{width:100%;background:linear-gradient(to top,#059669,#34d399);border-radius:6px;transition:height .6s ease;min-height:3px}
  .bc-day{font-size:.5625rem;color:#94a3b8;font-weight:500}
  .wb-list{display:flex;flex-direction:column;gap:.625rem}
  .wb-row{display:flex;align-items:center;gap:.625rem}
  .wb-left{display:flex;align-items:center;gap:.375rem;width:110px;flex-shrink:0}
  .wb-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .wb-type{font-size:.75rem;color:#475569;font-weight:600}
  .wb-bar-wrap{flex:1;height:7px;background:#f1f5f9;border-radius:999px;overflow:hidden}
  .wb-bar{height:100%;border-radius:999px;transition:width .6s}
  .wb-right{display:flex;gap:.375rem;align-items:center;width:55px;justify-content:flex-end;flex-shrink:0}
  .wb-cnt{font-size:.75rem;font-weight:700;color:#334155}
  .wb-pct{font-size:.6875rem;color:#94a3b8}
  .lf-labels{display:flex;justify-content:space-between;margin-bottom:.5rem;font-size:.8125rem;color:#475569;font-weight:600}
  .lf-pct.red{color:#dc2626;font-weight:800;font-size:1rem}
  .lf-bar-wrap{height:12px;background:#f1f5f9;border-radius:999px;overflow:hidden;margin-bottom:.5rem}
  .lf-bar{height:100%;background:#059669;border-radius:999px;transition:width .8s}
  .lf-bar.bar-warn{background:#f59e0b}
  .lf-bar.bar-crit{background:#ef4444}
  .lf-stats{display:flex;justify-content:space-between;font-size:.75rem;color:#64748b}
  .lf-rem{color:#059669;font-weight:600}
  .apps-card{border:1px solid #fcd34d;background:#fffdf0}
  .apps-list{display:flex;flex-direction:column;gap:.625rem}
  .app-item{display:flex;align-items:center;gap:.75rem;padding:.75rem;background:white;border:1px solid #e2e8f0;border-radius:.75rem}
  .app-av{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#059669);color:white;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:.875rem;flex-shrink:0}
  .app-info{flex:1;min-width:0}
  .app-name{display:block;font-size:.875rem;font-weight:700;color:#0f172a}
  .app-sub{display:block;font-size:.75rem;color:#64748b}
  .app-time{display:block;font-size:.6875rem;color:#94a3b8}
  .app-review{padding:.3rem .75rem;background:#ecfdf5;color:#059669;border:1px solid #6ee7b7;border-radius:6px;font-size:.75rem;font-weight:700;text-decoration:none;flex-shrink:0}
  .no-data{font-size:.875rem;color:#94a3b8;text-align:center;padding:1.5rem;margin:0}
  .td-name{font-size:.875rem;font-weight:600;color:#1e293b}
  .td-time{font-size:.75rem;color:#94a3b8;white-space:nowrap}
  .waste-tag{display:inline-block;padding:.2rem .55rem;border-radius:999px;font-size:.6875rem;font-weight:700}
  .qa-section h3{font-size:.875rem;font-weight:700;color:#0f172a;margin:0 0 .75rem}
  .qa-list{display:flex;flex-direction:column;gap:.375rem}
  .qa-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:white;border:1px solid #e2e8f0;border-radius:.75rem;font-size:.875rem;font-weight:600;color:#334155;text-decoration:none;transition:all .15s}
  .qa-item:hover{border-color:#059669;color:#059669;background:#f0fdf4}
  .qa-badge{margin-left:auto;background:#ef4444;color:white;font-size:.6875rem;font-weight:700;padding:.1rem .45rem;border-radius:999px}
  :global(.qa-green){color:#059669;flex-shrink:0}
  :global(.qa-purple){color:#8b5cf6;flex-shrink:0}
  :global(.qa-blue){color:#3b82f6;flex-shrink:0}
  :global(.qa-red){color:#ef4444;flex-shrink:0}
  :global(.qa-yellow){color:#f59e0b;flex-shrink:0}
</style>

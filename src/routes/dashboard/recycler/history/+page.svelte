<!-- src/routes/dashboard/recycler/history/+page.svelte -->
<script lang="ts">
  import { TrendingUp, Package, DollarSign, CheckCircle } from 'lucide-svelte';
  import { formatWeight, formatCurrency, formatDate } from '$lib/utils/api';

  export let data;
  $: ({ acceptedBids, total, monthlyData, totalSpend, totalContracts, limit } = data);

  const wasteColors: Record<string,string> = {
    ORGANIC:'#84cc16', PLASTIC:'#3b82f6', METAL:'#6b7280',
    GLASS:'#06b6d4', PAPER:'#f59e0b', HAZARDOUS:'#ef4444',
    ELECTRONIC:'#8b5cf6', MIXED:'#64748b',
  };

  $: maxVal = Math.max(...(monthlyData?.map((m: any) => m.value) ?? []), 1);
  $: pages  = Math.ceil(total / limit);
</script>

<svelte:head><title>Supply History — WasteLink</title></svelte:head>

<div class="history-page stagger-children">
  <div class="summary-row">
    <div class="sc"><div class="sc-icon green"><CheckCircle size={22}/></div><div><span class="sc-val">{totalContracts}</span><span class="sc-lab">Contracts Won</span></div></div>
    <div class="sc"><div class="sc-icon blue"><DollarSign size={22}/></div><div><span class="sc-val">{formatCurrency(totalSpend)}</span><span class="sc-lab">Total Spent</span></div></div>
    <div class="sc"><div class="sc-icon purple"><Package size={22}/></div><div><span class="sc-val">{total}</span><span class="sc-lab">Lots Sourced</span></div></div>
    <div class="sc"><div class="sc-icon amber"><TrendingUp size={22}/></div><div><span class="sc-val">{totalContracts > 0 ? formatCurrency(totalSpend / totalContracts) : '—'}</span><span class="sc-lab">Avg Contract</span></div></div>
  </div>

  <div class="chart-card">
    <h3>Monthly Procurement (Last 6 Months)</h3>
    <div class="bar-chart">
      {#each (monthlyData ?? []) as m}
        <div class="bc-col">
          <span class="bc-val">{m.value > 0 ? (m.value/1000).toFixed(0)+'k' : '—'}</span>
          <div class="bc-wrap">
            <div class="bc-bar" style="height:{(m.value / maxVal) * 100}%">
              {#if m.count > 0}
                <span class="bc-tip">{m.count} contract{m.count > 1 ? 's' : ''}<br/>{formatCurrency(m.value)}</span>
              {/if}
            </div>
          </div>
          <span class="bc-label">{m.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="table-card">
    <div class="tc-hdr"><h3>Accepted Contracts</h3><span class="tc-count">{total} total</span></div>
    {#if acceptedBids.length === 0}
      <div class="empty-state">
        <Package size={40} strokeWidth={1}/>
        <p>No accepted contracts yet. Place bids on available waste lots.</p>
        <a href="/dashboard/recycler/available" class="btn-primary" style="font-size:.875rem;padding:.5rem 1.25rem">Browse Waste</a>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Waste Type</th><th>Weight</th><th>Price/kg</th><th>Total</th><th>Date</th></tr></thead>
          <tbody>
            {#each acceptedBids as b}
              <tr>
                <td>
                  <div class="wt-cell">
                    <div class="wt-dot" style="background:{wasteColors[b.pickup?.wasteType]??'#64748b'}"></div>
                    <span>{b.pickup?.category?.name ?? b.pickup?.wasteType}</span>
                  </div>
                </td>
                <td>{formatWeight(b.pickup?.estimatedWeight ?? 0)}</td>
                <td class="td-price">{formatCurrency(b.pricePerKg)}</td>
                <td class="td-total">{formatCurrency(b.totalOffer)}</td>
                <td class="td-date">{formatDate(b.updatedAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if pages > 1}
        <div class="pagination">
          {#each Array(pages) as _, i}
            <a href="?page={i+1}" class="page-btn" class:active={data.page === i+1}>{i+1}</a>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .summary-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:900px){ .summary-row { grid-template-columns: repeat(2,1fr); } }
  .sc { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
  .sc-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sc-icon.green  { background: #ecfdf5; color: #059669; }
  .sc-icon.blue   { background: #eff6ff; color: #3b82f6; }
  .sc-icon.purple { background: #f5f3ff; color: #8b5cf6; }
  .sc-icon.amber  { background: #fffbeb; color: #d97706; }
  .sc-val { display: block; font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: #0f172a; letter-spacing: -.03em; }
  .sc-lab { display: block; font-size: .75rem; color: #64748b; }

  .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .chart-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .bar-chart { display: flex; align-items: flex-end; gap: .75rem; height: 150px; }
  .bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .3rem; height: 100%; }
  .bc-val { font-size: .6875rem; font-weight: 700; color: #334155; }
  .bc-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; background: #f8fafc; border-radius: 8px; overflow: visible; position: relative; }
  .bc-bar { width: 100%; background: linear-gradient(to top,#8b5cf6,#c4b5fd); border-radius: 8px 8px 0 0; min-height: 4px; transition: height .6s ease; position: relative; }
  .bc-bar:hover .bc-tip { display: block; }
  .bc-tip { display: none; position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; font-size: .6875rem; padding: .35rem .625rem; border-radius: 6px; white-space: nowrap; pointer-events: none; z-index: 10; line-height: 1.4; }
  .bc-label { font-size: .6875rem; color: #94a3b8; font-weight: 500; }

  .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .tc-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
  .tc-hdr h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0; }
  .tc-count  { font-size: .8125rem; color: #94a3b8; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 3rem; color: #94a3b8; text-align: center; }
  .empty-state p { font-size: .875rem; margin: 0; }
  .wt-cell { display: flex; align-items: center; gap: .5rem; }
  .wt-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .td-price { color: #64748b; }
  .td-total { font-weight: 700; color: #8b5cf6; }
  .td-date  { color: #94a3b8; white-space: nowrap; font-size: .8125rem; }
  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #8b5cf6; border-color: #8b5cf6; color: white; }
</style>

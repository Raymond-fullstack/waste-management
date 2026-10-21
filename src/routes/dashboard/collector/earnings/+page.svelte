<!-- src/routes/dashboard/collector/earnings/+page.svelte -->
<script lang="ts">
  import { DollarSign, TrendingUp, Package } from 'lucide-svelte';
  import { formatCurrency, formatDate } from '$lib/utils/api';

  export let data;
  $: ({ profile, transactions, monthlyData, weeklyEarnings, monthlyEarnings } = data);

  $: maxVal = Math.max(...(monthlyData?.map((m: any) => m.amount) ?? []), 1);
</script>

<svelte:head><title>Earnings — WasteLink</title></svelte:head>

<div class="earnings-page stagger-children">
  <!-- Summary Cards -->
  <div class="summary-row">
    <div class="sc">
      <div class="sc-icon green"><DollarSign size={22} strokeWidth={1.8}/></div>
      <div>
        <span class="sc-val">{formatCurrency(profile?.totalEarnings ?? 0)}</span>
        <span class="sc-lab">Total Earnings</span>
      </div>
    </div>
    <div class="sc">
      <div class="sc-icon blue"><TrendingUp size={22} strokeWidth={1.8}/></div>
      <div>
        <span class="sc-val">{formatCurrency(monthlyEarnings)}</span>
        <span class="sc-lab">This Month</span>
      </div>
    </div>
    <div class="sc">
      <div class="sc-icon purple"><DollarSign size={22} strokeWidth={1.8}/></div>
      <div>
        <span class="sc-val">{formatCurrency(weeklyEarnings)}</span>
        <span class="sc-lab">This Week</span>
      </div>
    </div>
    <div class="sc">
      <div class="sc-icon amber"><Package size={22} strokeWidth={1.8}/></div>
      <div>
        <span class="sc-val">{profile?.totalDeliveries ?? 0}</span>
        <span class="sc-lab">Total Deliveries</span>
      </div>
    </div>
  </div>

  <!-- Monthly Chart -->
  <div class="chart-card">
    <h3>Monthly Earnings (Last 6 Months)</h3>
    <div class="bar-chart">
      {#each (monthlyData ?? []) as m}
        <div class="bc-col">
          <span class="bc-val">{m.amount > 0 ? (m.amount/1000).toFixed(0)+'k' : '—'}</span>
          <div class="bc-wrap">
            <div class="bc-bar" style="height:{(m.amount / maxVal) * 100}%">
              {#if m.count > 0}
                <span class="bc-tip">{m.count} pickup{m.count > 1 ? 's' : ''}<br/>{formatCurrency(m.amount)}</span>
              {/if}
            </div>
          </div>
          <span class="bc-label">{m.label}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Transactions -->
  <div class="table-card">
    <h3>Transaction History</h3>
    {#if !transactions || transactions.length === 0}
      <div class="empty-state">
        <DollarSign size={40} strokeWidth={1}/>
        <p>No transactions yet. Complete pickups to earn.</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr><th>Description</th><th>Type</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {#each transactions as t}
              <tr>
                <td class="td-desc">{t.description}</td>
                <td><span class="type-tag">{t.type.replace('_', ' ')}</span></td>
                <td class="td-amount">{formatCurrency(t.amount)}</td>
                <td class="td-date">{formatDate(t.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
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
  .bc-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; background: #f8fafc; border-radius: 8px; position: relative; overflow: visible; }
  .bc-bar { width: 100%; background: linear-gradient(to top,#059669,#34d399); border-radius: 8px 8px 0 0; min-height: 4px; transition: height .6s ease; position: relative; }
  .bc-bar:hover .bc-tip { display: block; }
  .bc-tip { display: none; position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; font-size: .6875rem; padding: .35rem .625rem; border-radius: 6px; white-space: nowrap; pointer-events: none; z-index: 10; line-height: 1.4; }
  .bc-label { font-size: .6875rem; color: #94a3b8; font-weight: 500; }

  .table-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; }
  .table-card h3 { font-size: .9375rem; font-weight: 700; color: #0f172a; margin: 0 0 1.25rem; }
  .empty-state { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 2.5rem; color: #94a3b8; text-align: center; }
  .empty-state p { font-size: .875rem; margin: 0; }
  .td-desc   { font-size: .875rem; color: #334155; max-width: 300px; }
  .type-tag  { display: inline-block; padding: .2rem .5rem; background: #f1f5f9; color: #475569; border-radius: 6px; font-size: .6875rem; font-weight: 600; }
  .td-amount { font-weight: 700; color: #059669; white-space: nowrap; }
  .td-date   { color: #94a3b8; white-space: nowrap; font-size: .8125rem; }
</style>

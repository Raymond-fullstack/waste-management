<!-- src/lib/components/StatusBadge.svelte -->
<script lang="ts">
  export let status: string;
  export let size: 'sm' | 'md' = 'sm';

  const configs: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:              { label: 'Pending',     bg: '#fffbeb', color: '#92400e' },
    ACCEPTED:             { label: 'Accepted',    bg: '#eff6ff', color: '#1d4ed8' },
    EN_ROUTE:             { label: 'En Route',    bg: '#f0fdfa', color: '#0d9488' },
    COLLECTED:            { label: 'Collected',   bg: '#f5f3ff', color: '#7c3aed' },
    DELIVERED:            { label: 'Delivered',   bg: '#ecfdf5', color: '#059669' },
    CANCELLED:            { label: 'Cancelled',   bg: '#f8fafc', color: '#94a3b8' },
    ACTIVE:               { label: 'Active',      bg: '#ecfdf5', color: '#059669' },
    SUSPENDED:            { label: 'Suspended',   bg: '#fff7ed', color: '#c2410c' },
    REJECTED:             { label: 'Rejected',    bg: '#fee2e2', color: '#dc2626' },
    PENDING_VERIFICATION: { label: 'Pending',     bg: '#fffbeb', color: '#92400e' },
    APPROVED:             { label: 'Approved',    bg: '#ecfdf5', color: '#059669' },
    WITHDRAWN:            { label: 'Withdrawn',   bg: '#f8fafc', color: '#94a3b8' },
  };

  $: config = configs[status] ?? { label: status, bg: '#f1f5f9', color: '#475569' };
</script>

<span class="badge" class:sm={size === 'sm'} class:md={size === 'md'}
  style="background:{config.bg};color:{config.color}">
  {config.label}
</span>

<style>
  .badge {
    display: inline-flex; align-items: center; font-weight: 700;
    border-radius: 999px; white-space: nowrap;
  }
  .sm { font-size: .6875rem; padding: .15rem .5rem; }
  .md { font-size: .75rem;   padding: .2rem  .625rem; }
</style>

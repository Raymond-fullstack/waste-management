<script lang="ts">
  import { page } from '$app/stores';
  import DashboardLayout from '$lib/components/DashboardLayout.svelte';
  export let data;
  $: user = data.user;
  const titleMap: Record<string,string> = {
    '/dashboard/household': 'Overview', '/dashboard/household/request': 'Request Pickup',
    '/dashboard/household/pickups': 'My Pickups', '/dashboard/household/impact': 'My Impact',
    '/dashboard/household/become-collector': 'Become a Collector',
    '/dashboard/household/notifications': 'Notifications',
    '/dashboard/collector': 'Overview', '/dashboard/collector/available': 'Available Pickups',
    '/dashboard/collector/assignments': 'My Assignments', '/dashboard/collector/earnings': 'Earnings',
    '/dashboard/collector/notifications': 'Notifications',
    '/dashboard/recycler': 'Overview', '/dashboard/recycler/available': 'Available Waste',
    '/dashboard/recycler/bids': 'My Bids', '/dashboard/recycler/history': 'Supply History',
    '/dashboard/recycler/notifications': 'Notifications',
    '/dashboard/admin': 'City Dashboard', '/dashboard/admin/pickups': 'All Pickups',
    '/dashboard/admin/collector-requests': 'Collector Applications',
    '/dashboard/admin/collectors': 'Active Collectors', '/dashboard/admin/households': 'Households',
    '/dashboard/admin/recyclers': 'Recyclers', '/dashboard/admin/add-recycler': 'Add Recycler',
    '/dashboard/admin/zones': 'Zones & Districts', '/dashboard/admin/landfill': 'Landfill Monitor',
    '/dashboard/admin/pricing': 'Waste Pricing',
    '/dashboard/admin/reports': 'Reports', '/dashboard/admin/notifications': 'Notifications',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/settings': 'Account Settings',
  };
  $: title = titleMap[$page.url.pathname] ?? 'Dashboard';
</script>
{#if user}
  <DashboardLayout role={user.role} userName={user.name} avatarUrl={data.avatarUrl ?? null} {title}
    notificationCount={data.notificationCount ?? 0}
    pendingRequests={data.pendingRequests ?? 0}
    showBecomeCollector={data.showBecomeCollector ?? true}>
    <slot/>
  </DashboardLayout>
{/if}

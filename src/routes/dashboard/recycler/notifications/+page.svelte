<!-- src/routes/dashboard/recycler/notifications/+page.svelte -->
<script lang="ts">
  import NotificationsPage from '$lib/components/NotificationsPage.svelte';
  export let data;
</script>
<svelte:head><title>Notifications — WasteLink</title></svelte:head>
<NotificationsPage notifications={data.notifications} total={data.total} page={data.page} limit={data.limit}/>

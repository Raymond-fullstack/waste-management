<!-- src/lib/components/NotificationsPage.svelte -->
<script lang="ts">
  import { Bell, BellOff, Check } from 'lucide-svelte';
  import { timeAgo } from '$lib/utils/api';

  export let notifications: any[] = [];
  export let total: number = 0;
  export let page: number = 1;
  export let limit: number = 30;

  let markingAll = false;

  const typeColors: Record<string, string> = {
    PICKUP_REQUEST: '#3b82f6', PICKUP_ACCEPTED: '#059669', PICKUP_COLLECTED: '#8b5cf6',
    PICKUP_DELIVERED: '#059669', COLLECTOR_REQUEST: '#f59e0b', COLLECTOR_APPROVED: '#059669',
    COLLECTOR_REJECTED: '#ef4444', RATING_RECEIVED: '#f59e0b',
    BID_RECEIVED: '#0d9488', BID_ACCEPTED: '#059669', BID_REJECTED: '#ef4444', SYSTEM: '#64748b',
  };

  const typeEmoji: Record<string, string> = {
    PICKUP_REQUEST: '🗑️', PICKUP_ACCEPTED: '🚛', PICKUP_COLLECTED: '📦',
    PICKUP_DELIVERED: '✅', COLLECTOR_REQUEST: '📋', COLLECTOR_APPROVED: '🎉',
    COLLECTOR_REJECTED: '❌', RATING_RECEIVED: '⭐',
    BID_RECEIVED: '💰', BID_ACCEPTED: '✅', BID_REJECTED: '❌', SYSTEM: 'ℹ️',
  };

  $: unread = notifications.filter(n => !n.isRead).length;
  $: pages  = Math.ceil(total / limit);

  async function markAllRead() {
    markingAll = true;
    await fetch('/api/notifications', { method: 'PATCH' });
    window.location.reload();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    window.location.reload();
  }
</script>

<div class="notif-wrap">
  <div class="notif-header">
    <div class="nh-left">
      <h2>Notifications</h2>
      {#if unread > 0}<span class="unread-badge">{unread} unread</span>{/if}
    </div>
    {#if unread > 0}
      <button class="mark-all-btn" on:click={markAllRead} disabled={markingAll}>
        <Check size={13}/> {markingAll ? 'Marking...' : 'Mark all read'}
      </button>
    {/if}
  </div>

  {#if notifications.length === 0}
    <div class="empty-notif">
      <BellOff size={48} strokeWidth={1}/>
      <h3>No notifications</h3>
      <p>Activity updates and alerts will appear here.</p>
    </div>
  {:else}
    <div class="notif-list">
      {#each notifications as n}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="notif-item" class:unread={!n.isRead} on:click={() => !n.isRead && markRead(n.id)}>
          <div class="ni-icon" style="background:color-mix(in srgb,{typeColors[n.type]??'#64748b'} 12%,white)">
            <span class="ni-emoji">{typeEmoji[n.type] ?? '🔔'}</span>
          </div>
          <div class="ni-content">
            <div class="ni-top">
              <span class="ni-title">{n.title}</span>
              <span class="ni-time">{timeAgo(n.createdAt)}</span>
            </div>
            <p class="ni-msg">{n.message}</p>
          </div>
          {#if !n.isRead}<div class="ni-dot"></div>{/if}
        </div>
      {/each}
    </div>

    {#if pages > 1}
      <div class="pagination">
        {#each Array(pages) as _, i}
          <a href="?page={i+1}" class="page-btn" class:active={page === i+1}>{i+1}</a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .notif-wrap { max-width: 680px; }
  .notif-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
  .nh-left { display: flex; align-items: center; gap: .75rem; }
  .nh-left h2 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -.03em; }
  .unread-badge { padding: .2rem .625rem; background: #fee2e2; color: #dc2626; border-radius: 999px; font-size: .75rem; font-weight: 700; }
  .mark-all-btn { display: flex; align-items: center; gap: .375rem; padding: .4rem .875rem; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .8125rem; font-weight: 600; color: #475569; cursor: pointer; font-family: var(--font-body); transition: all .15s; }
  .mark-all-btn:hover { border-color: #059669; color: #059669; }

  .empty-notif { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 4rem 2rem; background: white; border: 1px solid #e2e8f0; border-radius: 1rem; color: #94a3b8; text-align: center; }
  .empty-notif h3 { font-size: 1rem; font-weight: 700; color: #475569; margin: 0; }
  .empty-notif p  { font-size: .875rem; margin: 0; }

  .notif-list { display: flex; flex-direction: column; gap: .5rem; }
  .notif-item { display: flex; align-items: flex-start; gap: .875rem; padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: .875rem; cursor: pointer; transition: all .15s; }
  .notif-item.unread { background: #f0fdf4; border-color: #a7f3d0; }
  .notif-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  .ni-icon { width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .ni-emoji { font-size: 1.25rem; }
  .ni-content { flex: 1; min-width: 0; }
  .ni-top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: .2rem; }
  .ni-title { font-size: .875rem; font-weight: 700; color: #0f172a; }
  .ni-time  { font-size: .6875rem; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }
  .ni-msg   { font-size: .8125rem; color: #475569; margin: 0; line-height: 1.5; white-space: pre-line; }
  .ni-dot   { width: 8px; height: 8px; border-radius: 50%; background: #059669; flex-shrink: 0; margin-top: 4px; }

  .pagination { display: flex; justify-content: center; gap: .375rem; margin-top: 1.5rem; }
  .page-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: .875rem; font-weight: 600; color: #475569; text-decoration: none; }
  .page-btn.active { background: #059669; border-color: #059669; color: white; }
</style>

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationsApi } from '@/api/notifications.api';
import type { Notification } from '@/types';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length);

  async function fetch() {
    try {
      notifications.value = await notificationsApi.list();
    } catch {}
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    const n = notifications.value.find((n) => n.id === id);
    if (n) n.is_read = true;
  }

  function startPolling() {
    fetch();
    if (!pollInterval) {
      pollInterval = setInterval(fetch, 60_000);
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  return { notifications, unreadCount, fetch, markRead, startPolling, stopPolling };
});

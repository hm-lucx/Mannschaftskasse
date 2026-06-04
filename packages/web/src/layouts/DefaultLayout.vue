<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <AppTopbar />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import AppSidebar from '@/components/common/AppSidebar.vue';
import AppTopbar from '@/components/common/AppTopbar.vue';
import { useNotificationsStore } from '@/stores/notifications.store';

const notifStore = useNotificationsStore();
onMounted(() => notifStore.startPolling());
onUnmounted(() => notifStore.stopPolling());
</script>

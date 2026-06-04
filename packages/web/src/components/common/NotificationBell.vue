<template>
  <div class="relative">
    <Button
      icon="pi pi-bell"
      text
      severity="secondary"
      size="small"
      @click="toggle"
    />
    <span
      v-if="store.unreadCount > 0"
      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
    >
      {{ Math.min(store.unreadCount, 9) }}
    </span>

    <div
      v-if="open"
      class="absolute right-0 top-8 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
    >
      <div class="p-3 border-b border-gray-100 font-medium text-sm text-gray-700">
        Benachrichtigungen
      </div>
      <div v-if="store.notifications.length === 0" class="p-4 text-sm text-gray-400 text-center">
        Keine Benachrichtigungen
      </div>
      <div v-for="n in store.notifications.slice(0, 5)" :key="n.id"
        class="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
        :class="{ 'bg-blue-50': !n.is_read }"
        @click="store.markRead(n.id)"
      >
        <div class="text-sm font-medium text-gray-800">{{ n.title }}</div>
        <div v-if="n.body" class="text-xs text-gray-500 mt-0.5">{{ n.body }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import { useNotificationsStore } from '@/stores/notifications.store';
import { onClickOutside } from '@vueuse/core';

const store = useNotificationsStore();
const open = ref(false);
const bellRef = ref(null);

function toggle() {
  open.value = !open.value;
}
</script>

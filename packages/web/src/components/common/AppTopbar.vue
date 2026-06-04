<template>
  <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
    <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
    <div class="flex items-center gap-4">
      <NotificationBell />
      <Button
        icon="pi pi-sign-out"
        text
        severity="secondary"
        size="small"
        title="Abmelden"
        @click="handleLogout"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import NotificationBell from './NotificationBell.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  calendar: 'Kalender',
  'event-detail': 'Event Details',
  fines: 'Strafen',
  'fine-catalog': 'Strafkatalog',
  payments: 'Zahlungen',
  ledger: 'Kassenbuch',
  reports: 'Statistiken',
  standings: 'Tabelle',
  'admin-users': 'Spielerverwaltung',
};

const pageTitle = computed(() => pageTitles[route.name as string] || 'Mannschaftskasse');

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="w-64 bg-blue-900 text-white flex flex-col shadow-xl">
    <!-- Logo -->
    <div class="p-5 border-b border-blue-800">
      <div class="text-xl font-bold">⚽ Union Schwand</div>
      <div class="text-xs text-blue-300 mt-0.5">Mannschaftskasse</div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="isActive(item.to) ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'"
      >
        <i :class="item.icon" class="text-base" />
        {{ item.label }}
      </RouterLink>
    </nav>

    <!-- User info -->
    <div class="p-4 border-t border-blue-800">
      <div class="text-sm font-medium">{{ auth.user?.first_name }} {{ auth.user?.last_name }}</div>
      <div class="text-xs text-blue-300">{{ rolesLabel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const route = useRoute();

const isActive = (path: string) => route.path.startsWith(path) && path !== '/';

const rolesLabel = computed(() =>
  auth.user?.roles?.join(', ') || '',
);

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: 'pi pi-home' },
    { to: '/calendar', label: 'Kalender', icon: 'pi pi-calendar' },
    { to: '/fines', label: 'Strafen', icon: 'pi pi-exclamation-circle' },
    { to: '/standings', label: 'Tabelle', icon: 'pi pi-chart-bar' },
  ];

  if (auth.hasAnyRole('ADMIN', 'COACH')) {
    items.push({ to: '/fines/catalog', label: 'Strafkatalog', icon: 'pi pi-list' });
    items.push({ to: '/reports', label: 'Statistiken', icon: 'pi pi-chart-line' });
  }

  if (auth.hasAnyRole('ADMIN', 'TREASURER')) {
    items.push({ to: '/payments', label: 'Zahlungen', icon: 'pi pi-credit-card' });
    items.push({ to: '/ledger', label: 'Kassenbuch', icon: 'pi pi-book' });
  }

  if (auth.isAdmin.value) {
    items.push({ to: '/admin/users', label: 'Spielerverwaltung', icon: 'pi pi-users' });
  }

  return items;
});
</script>

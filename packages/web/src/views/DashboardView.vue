<template>
  <div class="space-y-6">
    <div v-if="loading" class="flex items-center justify-center h-40">
      <ProgressSpinner />
    </div>

    <template v-else-if="data">
      <!-- Open Fines Card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-700">Offene Strafen</h2>
            <i class="pi pi-exclamation-circle text-red-500 text-xl" />
          </div>
          <div v-if="data.open_fines.count === 0" class="text-gray-400 text-sm">
            Keine offenen Strafen 🎉
          </div>
          <template v-else>
            <div class="text-3xl font-bold text-red-600">{{ formatEuro(data.open_fines.total_amount) }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ data.open_fines.count }} Strafe(n)</div>
            <div class="mt-4 space-y-2">
              <div v-for="fine in data.open_fines.items" :key="fine.id"
                class="flex justify-between text-sm border-t border-gray-50 pt-2"
              >
                <span class="text-gray-600">{{ fine.fine_category?.name }}</span>
                <span class="font-medium text-red-600">{{ formatEuro(fine.amount) }}</span>
              </div>
            </div>
            <RouterLink v-if="paypalUrl" :to="'#'"
              class="mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
              @click.prevent="openPaypal"
            >
              <i class="pi pi-paypal" />
              Via PayPal bezahlen
            </RouterLink>
          </template>
        </div>

        <!-- Next Events -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-700">Nächste Events</h2>
            <i class="pi pi-calendar text-blue-500 text-xl" />
          </div>
          <div v-if="!data.next_events?.length" class="text-gray-400 text-sm">
            Keine anstehenden Events
          </div>
          <div v-for="event in data.next_events" :key="event.id" class="mb-3 last:mb-0">
            <RouterLink :to="`/events/${event.id}`" class="block hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
              <div class="flex items-center gap-2">
                <StatusBadge :status="event.type" />
                <span class="text-sm font-medium text-gray-800 truncate">{{ event.title }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-1 ml-1">
                {{ formatDate(event.starts_at) }}
              </div>
              <div v-if="event.my_participation" class="mt-1 ml-1">
                <StatusBadge :status="event.my_participation.status" />
              </div>
            </RouterLink>
          </div>
          <RouterLink to="/calendar" class="text-xs text-blue-600 hover:underline mt-2 block">
            Alle Events →
          </RouterLink>
        </div>

        <!-- Recent Payments -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-700">Letzte Zahlungen</h2>
            <i class="pi pi-credit-card text-green-500 text-xl" />
          </div>
          <div v-if="!data.recent_payments?.length" class="text-gray-400 text-sm">
            Noch keine Zahlungen
          </div>
          <div v-for="p in data.recent_payments" :key="p.id" class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <div>
              <div class="text-sm font-medium text-gray-700">{{ formatEuro(p.amount) }}</div>
              <div class="text-xs text-gray-400">{{ formatDate(p.paid_at) }}</div>
            </div>
            <StatusBadge status="PAID" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import ProgressSpinner from 'primevue/progressspinner';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/stores/auth.store';

const auth = useAuthStore();
const data = ref<any>(null);
const loading = ref(true);

const paypalUsername = ref(localStorage.getItem('paypal_me_username') || '');
const paypalUrl = computed(() => {
  if (!paypalUsername.value || !data.value?.open_fines?.total_amount) return null;
  return `https://paypal.me/${paypalUsername.value}/${data.value.open_fines.total_amount}EUR`;
});

function openPaypal() {
  if (paypalUrl.value) window.open(paypalUrl.value, '_blank');
}

const formatEuro = (amount: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(amount));

const formatDate = (d: string) =>
  format(new Date(d), 'EEE, dd. MMM HH:mm', { locale: de });

onMounted(async () => {
  try {
    data.value = await usersApi.dashboard();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

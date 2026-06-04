<template>
  <div class="space-y-6 max-w-3xl">
    <div v-if="loading" class="flex justify-center h-40 items-center">
      <ProgressSpinner />
    </div>

    <template v-else-if="event">
      <!-- Event header -->
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <StatusBadge :status="event.type" />
              <StatusBadge v-if="event.is_cancelled" status="CANCELLED" />
            </div>
            <h1 class="text-2xl font-bold text-gray-800">{{ event.title }}</h1>
            <div class="text-gray-500 mt-1">{{ formatDate(event.starts_at) }}</div>
            <div v-if="event.location" class="text-gray-500 text-sm mt-1">
              <i class="pi pi-map-marker mr-1" />{{ event.location }}
            </div>
            <div v-if="event.response_deadline" class="text-sm mt-2 text-orange-600">
              <i class="pi pi-clock mr-1" />Rückmeldung bis: {{ formatDate(event.response_deadline) }}
            </div>
          </div>
        </div>
        <div v-if="event.notes" class="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          {{ event.notes }}
        </div>
      </div>

      <!-- Player response card -->
      <div v-if="!auth.hasAnyRole('ADMIN', 'COACH')" class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="font-semibold text-gray-700 mb-4">Meine Antwort</h2>
        <div v-if="myParticipation" class="mb-4">
          <StatusBadge :status="myParticipation.status" />
          <div v-if="myParticipation.decline_reason" class="text-sm text-gray-500 mt-2">
            Grund: {{ myParticipation.decline_reason }}
          </div>
        </div>
        <div v-if="!event.is_cancelled && !deadlinePassed" class="space-y-3">
          <div class="flex gap-2">
            <Button label="Zusagen" icon="pi pi-check" severity="success" @click="respond('ACCEPTED')" :loading="responding === 'ACCEPTED'" />
            <Button label="Absagen" icon="pi pi-times" severity="danger" outlined @click="showDeclineDialog = true" />
          </div>
        </div>
        <div v-else-if="deadlinePassed" class="text-sm text-gray-400">
          Die Rückmeldefrist ist abgelaufen.
        </div>
      </div>

      <!-- Coach attendance view -->
      <div v-if="auth.hasAnyRole('ADMIN', 'COACH') && responses" class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="font-semibold text-gray-700 mb-4">Teilnahme</h2>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ responses.counts.accepted }}</div>
            <div class="text-xs text-gray-500">Zugesagt</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">{{ responses.counts.declined }}</div>
            <div class="text-xs text-gray-500">Abgesagt</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-600">{{ responses.counts.pending }}</div>
            <div class="text-xs text-gray-500">Ausstehend</div>
          </div>
        </div>

        <div v-if="responses.accepted.length">
          <h3 class="text-sm font-medium text-green-700 mb-2">Zugesagt</h3>
          <div v-for="p in responses.accepted" :key="p.id" class="text-sm text-gray-700 py-1 border-b border-gray-50">
            {{ p.user?.first_name }} {{ p.user?.last_name }}
          </div>
        </div>
        <div v-if="responses.declined.length" class="mt-4">
          <h3 class="text-sm font-medium text-red-700 mb-2">Abgesagt</h3>
          <div v-for="p in responses.declined" :key="p.id" class="py-1 border-b border-gray-50">
            <div class="text-sm text-gray-700">{{ p.user?.first_name }} {{ p.user?.last_name }}</div>
            <div class="text-xs text-gray-400">{{ p.decline_reason }}</div>
          </div>
        </div>
        <div v-if="responses.pending.length" class="mt-4">
          <h3 class="text-sm font-medium text-yellow-700 mb-2">Ausstehend</h3>
          <div v-for="p in responses.pending" :key="p.id" class="text-sm text-gray-500 py-1 border-b border-gray-50">
            {{ p.user?.first_name }} {{ p.user?.last_name }}
          </div>
        </div>
      </div>
    </template>

    <!-- Decline dialog -->
    <Dialog v-model:visible="showDeclineDialog" header="Absage begründen" modal>
      <div class="p-1">
        <label class="block text-sm font-medium text-gray-700 mb-1">Grund (Pflichtfeld)</label>
        <Textarea v-model="declineReason" class="w-full" rows="3" placeholder="z.B. Verletzung, Urlaub, Arbeit..." />
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showDeclineDialog = false" />
        <Button label="Absagen" severity="danger" :loading="responding === 'DECLINED'" @click="submitDecline" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { eventsApi } from '@/api/events.api';
import { useAuthStore } from '@/stores/auth.store';
import type { Event, Participation } from '@/types';

const route = useRoute();
const auth = useAuthStore();
const toast = useToast();

const event = ref<Event | null>(null);
const responses = ref<any>(null);
const loading = ref(true);
const responding = ref<string | null>(null);
const showDeclineDialog = ref(false);
const declineReason = ref('');

const myParticipation = computed<Participation | null>(() =>
  (event.value as any)?.participations?.find((p: Participation) => p.user_id === auth.user?.id) || null,
);

const deadlinePassed = computed(() => {
  if (!event.value?.response_deadline) return false;
  return new Date() > new Date(event.value.response_deadline);
});

const formatDate = (d: string) => format(new Date(d), 'EEEE, dd. MMMM yyyy HH:mm', { locale: de });

async function load() {
  const id = route.params.id as string;
  try {
    event.value = await eventsApi.get(id);
    if (auth.hasAnyRole('ADMIN', 'COACH')) {
      responses.value = await eventsApi.getResponses(id);
    }
  } finally {
    loading.value = false;
  }
}

async function respond(status: string) {
  responding.value = status;
  try {
    await eventsApi.respond(route.params.id as string, { status });
    toast.add({ severity: 'success', summary: 'Antwort gespeichert', life: 2000 });
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    responding.value = null;
  }
}

async function submitDecline() {
  if (!declineReason.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Bitte einen Grund angeben', life: 3000 });
    return;
  }
  responding.value = 'DECLINED';
  try {
    await eventsApi.respond(route.params.id as string, { status: 'DECLINED', decline_reason: declineReason.value });
    toast.add({ severity: 'success', summary: 'Absage gespeichert', life: 2000 });
    showDeclineDialog.value = false;
    declineReason.value = '';
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    responding.value = null;
  }
}

onMounted(load);
</script>

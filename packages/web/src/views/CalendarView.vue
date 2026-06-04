<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <Button
          v-for="tab in ['list', 'calendar']"
          :key="tab"
          :label="tab === 'list' ? 'Liste' : 'Kalender'"
          :severity="activeTab === tab ? 'primary' : 'secondary'"
          text
          size="small"
          @click="activeTab = tab"
        />
      </div>
      <Button
        v-if="auth.hasAnyRole('ADMIN', 'COACH')"
        label="Event erstellen"
        icon="pi pi-plus"
        size="small"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- List view -->
    <div v-if="activeTab === 'list'" class="bg-white rounded-xl shadow-sm">
      <DataTable :value="events" :loading="loading" stripedRows
        :globalFilterFields="['title', 'location']"
        responsiveLayout="scroll"
      >
        <Column header="Datum" field="starts_at" :sortable="true">
          <template #body="{ data }">
            <div class="text-sm font-medium">{{ formatDate(data.starts_at) }}</div>
          </template>
        </Column>
        <Column header="Typ" field="type">
          <template #body="{ data }">
            <StatusBadge :status="data.type" />
          </template>
        </Column>
        <Column header="Event" field="title">
          <template #body="{ data }">
            <div>
              <div class="font-medium text-gray-800">{{ data.title }}</div>
              <div class="text-xs text-gray-400">{{ data.location }}</div>
            </div>
          </template>
        </Column>
        <Column header="Mein Status">
          <template #body="{ data }">
            <StatusBadge v-if="data.my_participation" :status="data.my_participation.status" />
            <span v-else class="text-gray-400 text-xs">—</span>
          </template>
        </Column>
        <Column>
          <template #body="{ data }">
            <RouterLink :to="`/events/${data.id}`">
              <Button icon="pi pi-eye" text size="small" />
            </RouterLink>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Calendar view -->
    <div v-else class="bg-white rounded-xl shadow-sm p-4">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- Create Event Dialog -->
    <Dialog v-model:visible="showCreateDialog" header="Neues Event" modal class="w-full max-w-lg">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Typ</label>
          <Select v-model="form.type" :options="eventTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Titel</label>
          <InputText v-model="form.title" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Ort</label>
          <InputText v-model="form.location" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Beginn</label>
          <DatePicker v-model="form.starts_at" showTime hourFormat="24" class="w-full" dateFormat="dd.mm.yy" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rückmeldung bis</label>
          <DatePicker v-model="form.response_deadline" showTime hourFormat="24" class="w-full" dateFormat="dd.mm.yy" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
          <Textarea v-model="form.notes" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showCreateDialog = false" />
        <Button label="Erstellen" icon="pi pi-check" :loading="saving" @click="createEvent" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { eventsApi } from '@/api/events.api';
import { useAuthStore } from '@/stores/auth.store';
import type { Event } from '@/types';

const auth = useAuthStore();
const toast = useToast();
const events = ref<Event[]>([]);
const loading = ref(true);
const activeTab = ref('list');
const showCreateDialog = ref(false);
const saving = ref(false);

const form = ref({
  type: 'TRAINING',
  title: '',
  location: '',
  starts_at: null as Date | null,
  response_deadline: null as Date | null,
  notes: '',
});

const eventTypeOptions = [
  { label: 'Training', value: 'TRAINING' },
  { label: 'Spiel', value: 'MATCH' },
  { label: 'Sonstiges', value: 'OTHER' },
];

const eventColors: Record<string, string> = {
  TRAINING: '#3b82f6',
  MATCH: '#8b5cf6',
  OTHER: '#6b7280',
};

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, listPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'de',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,listMonth',
  },
  events: events.value.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.starts_at,
    color: e.is_cancelled ? '#9ca3af' : eventColors[e.type] || '#6b7280',
    url: `/events/${e.id}`,
  })),
  eventClick: (info: any) => {
    info.jsEvent.preventDefault();
    window.location.href = info.event.url;
  },
}));

const formatDate = (d: string) =>
  format(new Date(d), 'EEE dd. MMM, HH:mm', { locale: de });

async function load() {
  try {
    events.value = await eventsApi.list();
  } finally {
    loading.value = false;
  }
}

async function createEvent() {
  if (!form.value.title || !form.value.starts_at) {
    toast.add({ severity: 'warn', summary: 'Pflichtfelder fehlen', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    await eventsApi.create({
      ...form.value,
      starts_at: form.value.starts_at?.toISOString(),
      response_deadline: form.value.response_deadline?.toISOString(),
    });
    toast.add({ severity: 'success', summary: 'Event erstellt', life: 3000 });
    showCreateDialog.value = false;
    form.value = { type: 'TRAINING', title: '', location: '', starts_at: null, response_deadline: null, notes: '' };
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

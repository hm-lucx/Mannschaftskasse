<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
      <DatePicker v-model="from" dateFormat="dd.mm.yy" placeholder="Von" class="w-40" />
      <DatePicker v-model="to" dateFormat="dd.mm.yy" placeholder="Bis" class="w-40" />
      <Button label="Laden" icon="pi pi-refresh" size="small" @click="loadAll" />
      <Button label="CSV Export" icon="pi pi-download" size="small" severity="secondary" @click="exportCsv" />
    </div>

    <!-- Tabs -->
    <TabView>
      <TabPanel header="Anwesenheit">
        <DataTable :value="attendance" :loading="loadingAttendance" stripedRows class="mt-2">
          <Column header="Spieler" field="name" :sortable="true" />
          <Column header="Gesamt" field="total" :sortable="true" />
          <Column header="Zugesagt" field="accepted" :sortable="true">
            <template #body="{ data }">
              <span class="text-green-600 font-medium">{{ data.accepted }}</span>
            </template>
          </Column>
          <Column header="Abgesagt" field="declined" :sortable="true">
            <template #body="{ data }">
              <span class="text-red-600 font-medium">{{ data.declined }}</span>
            </template>
          </Column>
          <Column header="Quote">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <div class="h-2 bg-gray-100 rounded-full w-20 overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full" :style="`width: ${data.acceptance_rate}%`" />
                </div>
                <span class="text-sm text-gray-600">{{ data.acceptance_rate }}%</span>
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <TabPanel header="Strafen">
        <DataTable :value="finesReport" :loading="loadingFines" stripedRows class="mt-2">
          <Column header="Spieler" field="name" :sortable="true" />
          <Column header="Anzahl" field="count" :sortable="true" />
          <Column header="Gesamt">
            <template #body="{ data }">{{ formatEuro(data.total_amount) }}</template>
          </Column>
          <Column header="Offen">
            <template #body="{ data }">
              <span class="text-red-600 font-medium">{{ formatEuro(data.open_amount) }}</span>
            </template>
          </Column>
          <Column header="Bezahlt">
            <template #body="{ data }">
              <span class="text-green-600 font-medium">{{ formatEuro(data.paid_amount) }}</span>
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import { useToast } from 'primevue/usetoast';
import { reportsApi } from '@/api/reports.api';
import type { AttendanceReport, FinesReport } from '@/types';

const toast = useToast();
const from = ref<Date | null>(null);
const to = ref<Date | null>(null);
const attendance = ref<AttendanceReport[]>([]);
const finesReport = ref<FinesReport[]>([]);
const loadingAttendance = ref(false);
const loadingFines = ref(false);

const formatEuro = (v: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(v));

function buildParams() {
  return {
    from: from.value?.toISOString(),
    to: to.value?.toISOString(),
  };
}

async function loadAll() {
  const params = buildParams();
  loadingAttendance.value = true;
  loadingFines.value = true;
  try {
    const [att, fin] = await Promise.all([
      reportsApi.attendance(params),
      reportsApi.fines(params),
    ]);
    attendance.value = att;
    finesReport.value = fin;
  } finally {
    loadingAttendance.value = false;
    loadingFines.value = false;
  }
}

async function exportCsv() {
  try {
    const blob = await reportsApi.exportCsv(buildParams());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mannschaftskasse-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.add({ severity: 'error', summary: 'Export fehlgeschlagen', life: 3000 });
  }
}

onMounted(loadAll);
</script>

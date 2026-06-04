<template>
  <div class="space-y-4">
    <div class="bg-white rounded-xl shadow-sm">
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 class="font-semibold text-gray-700">Ligaportal Tabelle</h2>
        <span v-if="updatedAt" class="text-xs text-gray-400">
          Aktualisiert: {{ formatDate(updatedAt) }}
        </span>
      </div>
      <DataTable :value="standings" :loading="loading" stripedRows
        :row-class="rowClass"
      >
        <Column header="#" field="rank" style="width: 50px" />
        <Column header="Verein" field="team" />
        <Column header="Sp" field="played" />
        <Column header="S" field="won" />
        <Column header="U" field="drawn" />
        <Column header="N" field="lost" />
        <Column header="+/-" field="goal_diff" />
        <Column header="Pkt" field="points">
          <template #body="{ data }">
            <span class="font-bold">{{ data.points }}</span>
          </template>
        </Column>
      </DataTable>

      <div v-if="!loading && !standings.length" class="p-8 text-center text-gray-400">
        Keine Daten verfügbar (Scraper kann ligaportal.at nicht erreichen)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { reportsApi } from '@/api/reports.api';

const standings = ref<any[]>([]);
const updatedAt = ref<string | null>(null);
const loading = ref(true);

const formatDate = (d: string) => format(new Date(d), 'dd. MMM yyyy HH:mm', { locale: de });

function rowClass(row: any) {
  return row.is_highlighted ? 'bg-yellow-50 font-semibold' : '';
}

onMounted(async () => {
  try {
    const data = await reportsApi.standings();
    standings.value = data.standings || [];
    updatedAt.value = data.updatedAt;
  } finally {
    loading.value = false;
  }
});
</script>

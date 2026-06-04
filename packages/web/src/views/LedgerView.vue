<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="bg-white rounded-xl px-6 py-3 shadow-sm flex items-center gap-3">
        <span class="text-sm text-gray-600">Kassenstand:</span>
        <span class="text-xl font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ formatEuro(balance) }}
        </span>
      </div>
      <Button label="Eintrag hinzufügen" icon="pi pi-plus" size="small" @click="showDialog = true" />
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <DataTable :value="entries" :loading="loading" stripedRows>
        <Column header="Datum">
          <template #body="{ data }">{{ formatDate(data.occurred_at) }}</template>
        </Column>
        <Column header="Typ">
          <template #body="{ data }">
            <StatusBadge :status="data.type" />
          </template>
        </Column>
        <Column header="Kategorie" field="category" />
        <Column header="Betrag">
          <template #body="{ data }">
            <span :class="data.type === 'INCOME' ? 'text-green-600' : 'text-red-600'" class="font-semibold">
              {{ data.type === 'INCOME' ? '+' : '-' }}{{ formatEuro(data.amount) }}
            </span>
          </template>
        </Column>
        <Column header="Notiz" field="note" />
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" header="Kasseneintrag" modal class="w-full max-w-sm">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Typ</label>
          <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
          <InputText v-model="form.category" class="w-full" placeholder="z.B. Turnier-Erlös" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Betrag (€)</label>
          <InputNumber v-model="form.amount" :minFractionDigits="2" :min="0.01" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
          <InputText v-model="form.note" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showDialog = false" />
        <Button label="Speichern" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { paymentsApi } from '@/api/payments.api';
import type { CashLedgerEntry } from '@/types';

const toast = useToast();
const entries = ref<CashLedgerEntry[]>([]);
const balance = ref(0);
const loading = ref(true);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ type: 'INCOME', category: '', amount: 0, note: '' });

const typeOptions = [
  { label: 'Einnahme', value: 'INCOME' },
  { label: 'Ausgabe', value: 'EXPENSE' },
];

const formatEuro = (v: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(v));

const formatDate = (d: string) => format(new Date(d), 'dd. MMM yyyy', { locale: de });

async function load() {
  loading.value = true;
  try {
    const data = await paymentsApi.getLedger();
    entries.value = data.entries;
    balance.value = data.balance;
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    await paymentsApi.createLedgerEntry(form.value);
    toast.add({ severity: 'success', summary: 'Eintrag gespeichert', life: 2000 });
    showDialog.value = false;
    form.value = { type: 'INCOME', category: '', amount: 0, note: '' };
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

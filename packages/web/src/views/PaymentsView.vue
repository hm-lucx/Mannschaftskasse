<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <Button label="Zahlung erfassen" icon="pi pi-plus" size="small" @click="openDialog" />
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <DataTable :value="payments" :loading="loading" stripedRows>
        <Column header="Spieler">
          <template #body="{ data }">
            {{ data.user?.first_name }} {{ data.user?.last_name }}
          </template>
        </Column>
        <Column header="Betrag">
          <template #body="{ data }">
            <span class="font-semibold text-green-600">{{ formatEuro(data.amount) }}</span>
          </template>
        </Column>
        <Column header="Datum">
          <template #body="{ data }">{{ formatDate(data.paid_at) }}</template>
        </Column>
        <Column header="Methode" field="provider" />
        <Column header="Notiz" field="notes" />
        <Column header="Strafen">
          <template #body="{ data }">
            <div v-for="link in data.fine_payment_links" :key="link.id" class="text-xs text-gray-500">
              {{ link.fine?.fine_category?.name }} ({{ formatEuro(link.allocated_amount) }})
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Record Payment Dialog -->
    <Dialog v-model:visible="showDialog" header="Zahlung erfassen" modal class="w-full max-w-lg">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Spieler</label>
          <Select v-model="form.user_id" :options="memberOptions" optionLabel="label" optionValue="value"
            class="w-full" placeholder="Spieler wählen" @change="loadPlayerFines" />
        </div>
        <div v-if="openFines.length">
          <label class="block text-sm font-medium text-gray-700 mb-2">Offene Strafen zuweisen</label>
          <div v-for="fine in openFines" :key="fine.id"
            class="flex items-center gap-3 py-2 border-b border-gray-100"
          >
            <Checkbox v-model="selectedFineIds" :value="fine.id" />
            <span class="text-sm flex-1">{{ fine.fine_category?.name }}</span>
            <span class="text-sm font-medium text-red-600">{{ formatEuro(fine.amount) }}</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Betrag (€)</label>
          <InputNumber v-model="form.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0.01" class="w-full" />
          <p class="text-xs text-gray-400 mt-1">Muss gleich der Summe der ausgewählten Strafen sein.</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
          <InputText v-model="form.notes" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showDialog = false" />
        <Button label="Erfassen" icon="pi pi-check" :loading="saving" @click="recordPayment" />
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
import Checkbox from 'primevue/checkbox';
import { useToast } from 'primevue/usetoast';
import { paymentsApi } from '@/api/payments.api';
import { finesApi } from '@/api/fines.api';
import { teamApi } from '@/api/team.api';
import type { Payment, Fine, TeamMembership } from '@/types';

const toast = useToast();
const payments = ref<Payment[]>([]);
const loading = ref(true);
const showDialog = ref(false);
const saving = ref(false);
const memberOptions = ref<{ label: string; value: string }[]>([]);
const openFines = ref<Fine[]>([]);
const selectedFineIds = ref<string[]>([]);
const form = ref({ user_id: '', amount: 0, notes: '' });

const formatEuro = (v: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(v));

const formatDate = (d: string) => format(new Date(d), 'dd. MMM yyyy', { locale: de });

async function load() {
  loading.value = true;
  try {
    payments.value = await paymentsApi.list();
  } finally {
    loading.value = false;
  }
}

async function openDialog() {
  const members = await teamApi.members();
  memberOptions.value = members.map((m: TeamMembership) => ({
    label: `${m.user.first_name} ${m.user.last_name}`,
    value: m.user_id,
  }));
  form.value = { user_id: '', amount: 0, notes: '' };
  selectedFineIds.value = [];
  openFines.value = [];
  showDialog.value = true;
}

async function loadPlayerFines() {
  if (!form.value.user_id) return;
  const allFines = await finesApi.list({ status: 'OPEN' });
  openFines.value = allFines.filter((f: Fine) => f.user_id === form.value.user_id);
  selectedFineIds.value = [];
  form.value.amount = 0;
}

async function recordPayment() {
  if (!form.value.user_id || !form.value.amount) {
    toast.add({ severity: 'warn', summary: 'Pflichtfelder fehlen', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    const allocations = selectedFineIds.value.map((fineId) => {
      const fine = openFines.value.find((f) => f.id === fineId);
      return { fine_id: fineId, allocated_amount: Number(fine?.amount || 0) };
    });

    if (allocations.length === 0) {
      toast.add({ severity: 'warn', summary: 'Bitte mindestens eine Strafe auswählen', life: 3000 });
      return;
    }

    await paymentsApi.create({
      user_id: form.value.user_id,
      amount: form.value.amount,
      notes: form.value.notes,
      fine_allocations: allocations,
    });

    toast.add({ severity: 'success', summary: 'Zahlung erfasst', life: 3000 });
    showDialog.value = false;
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

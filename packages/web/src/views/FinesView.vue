<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <Button v-for="s in statusOptions" :key="s.value"
          :label="s.label"
          :severity="statusFilter === s.value ? 'primary' : 'secondary'"
          text size="small"
          @click="statusFilter = s.value; load()"
        />
      </div>
      <Button
        v-if="auth.hasAnyRole('ADMIN', 'COACH')"
        label="Strafe zuweisen"
        icon="pi pi-plus"
        size="small"
        @click="showAssignDialog = true"
      />
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <DataTable :value="fines" :loading="loading" stripedRows responsiveLayout="scroll">
        <Column v-if="auth.hasAnyRole('ADMIN', 'COACH', 'TREASURER')" header="Spieler" field="user.first_name">
          <template #body="{ data }">
            {{ data.user?.first_name }} {{ data.user?.last_name }}
          </template>
        </Column>
        <Column header="Kategorie" field="fine_category.name" />
        <Column header="Betrag">
          <template #body="{ data }">
            <span class="font-semibold text-red-600">{{ formatEuro(data.amount) }}</span>
          </template>
        </Column>
        <Column header="Status">
          <template #body="{ data }">
            <StatusBadge :status="data.status" />
          </template>
        </Column>
        <Column header="Datum">
          <template #body="{ data }">
            {{ formatDate(data.assigned_at) }}
          </template>
        </Column>
        <Column header="Notiz" field="notes" />
        <Column v-if="auth.hasAnyRole('ADMIN', 'COACH')">
          <template #body="{ data }">
            <Button v-if="data.status === 'OPEN'"
              icon="pi pi-trash" text size="small" severity="danger"
              @click="cancelFine(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Assign Fine Dialog -->
    <Dialog v-model:visible="showAssignDialog" header="Strafe zuweisen" modal class="w-full max-w-md">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Spieler</label>
          <Select v-model="form.user_id" :options="members" optionLabel="label" optionValue="value" class="w-full" placeholder="Spieler wählen" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
          <Select v-model="form.fine_category_id" :options="categories" optionLabel="label" optionValue="value" class="w-full" placeholder="Kategorie wählen" @change="onCategoryChange" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Betrag (€)</label>
          <InputNumber v-model="form.amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0.01" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
          <InputText v-model="form.notes" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showAssignDialog = false" />
        <Button label="Zuweisen" icon="pi pi-check" :loading="saving" @click="assignFine" />
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
import { useConfirm } from 'primevue/useconfirm';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { finesApi } from '@/api/fines.api';
import { teamApi } from '@/api/team.api';
import { useAuthStore } from '@/stores/auth.store';
import type { Fine, FineCategory, TeamMembership } from '@/types';

const auth = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const fines = ref<Fine[]>([]);
const categories = ref<{ label: string; value: string; amount: number }[]>([]);
const members = ref<{ label: string; value: string }[]>([]);
const loading = ref(true);
const statusFilter = ref<string | undefined>(undefined);
const showAssignDialog = ref(false);
const saving = ref(false);

const form = ref({ user_id: '', fine_category_id: '', amount: 0, notes: '' });

const statusOptions = [
  { label: 'Alle', value: undefined },
  { label: 'Offen', value: 'OPEN' },
  { label: 'Bezahlt', value: 'PAID' },
];

const formatEuro = (v: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(v));

const formatDate = (d: string) => format(new Date(d), 'dd. MMM yyyy', { locale: de });

function onCategoryChange() {
  const cat = categories.value.find((c) => c.value === form.value.fine_category_id);
  if (cat) form.value.amount = cat.amount;
}

async function load() {
  loading.value = true;
  try {
    fines.value = await finesApi.list(statusFilter.value ? { status: statusFilter.value } : {});
  } finally {
    loading.value = false;
  }
}

async function loadMeta() {
  const [cats, mems] = await Promise.all([finesApi.listCategories(), teamApi.members()]);
  categories.value = cats.map((c: FineCategory) => ({ label: `${c.name} (${formatEuro(c.default_amount)})`, value: c.id, amount: c.default_amount }));
  members.value = mems.map((m: TeamMembership) => ({
    label: `${m.user.first_name} ${m.user.last_name}`,
    value: m.user_id,
  }));
}

async function assignFine() {
  if (!form.value.user_id || !form.value.fine_category_id || !form.value.amount) {
    toast.add({ severity: 'warn', summary: 'Pflichtfelder fehlen', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    await finesApi.create(form.value);
    toast.add({ severity: 'success', summary: 'Strafe zugewiesen', life: 3000 });
    showAssignDialog.value = false;
    form.value = { user_id: '', fine_category_id: '', amount: 0, notes: '' };
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    saving.value = false;
  }
}

async function cancelFine(id: string) {
  confirm.require({
    message: 'Strafe wirklich stornieren?',
    header: 'Bestätigung',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await finesApi.cancel(id);
      toast.add({ severity: 'info', summary: 'Strafe storniert', life: 2000 });
      load();
    },
  });
}

onMounted(() => { load(); loadMeta(); });
</script>

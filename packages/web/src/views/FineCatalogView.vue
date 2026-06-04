<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <Button label="Neue Kategorie" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>
    <div class="bg-white rounded-xl shadow-sm">
      <DataTable :value="categories" :loading="loading" stripedRows>
        <Column header="Name" field="name" />
        <Column header="Betrag">
          <template #body="{ data }">{{ formatEuro(data.default_amount) }}</template>
        </Column>
        <Column header="Status">
          <template #body="{ data }">
            <span :class="data.is_active ? 'text-green-600' : 'text-gray-400'" class="text-sm">
              {{ data.is_active ? 'Aktiv' : 'Inaktiv' }}
            </span>
          </template>
        </Column>
        <Column>
          <template #body="{ data }">
            <Button icon="pi pi-pencil" text size="small" @click="openEdit(data)" />
            <Button icon="pi pi-trash" text size="small" severity="danger" @click="deleteCategory(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" :header="editId ? 'Kategorie bearbeiten' : 'Neue Kategorie'" modal class="w-full max-w-sm">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <InputText v-model="form.name" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Standardbetrag (€)</label>
          <InputNumber v-model="form.default_amount" :minFractionDigits="2" :maxFractionDigits="2" :min="0.01" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showDialog = false" />
        <Button :label="editId ? 'Speichern' : 'Erstellen'" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import { finesApi } from '@/api/fines.api';
import type { FineCategory } from '@/types';

const toast = useToast();
const categories = ref<FineCategory[]>([]);
const loading = ref(true);
const showDialog = ref(false);
const saving = ref(false);
const editId = ref<string | null>(null);
const form = ref({ name: '', default_amount: 5 });

const formatEuro = (v: number) =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(Number(v));

async function load() {
  loading.value = true;
  try {
    categories.value = await finesApi.listCategories();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editId.value = null;
  form.value = { name: '', default_amount: 5 };
  showDialog.value = true;
}

function openEdit(cat: FineCategory) {
  editId.value = cat.id;
  form.value = { name: cat.name, default_amount: Number(cat.default_amount) };
  showDialog.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editId.value) {
      await finesApi.updateCategory(editId.value, form.value);
    } else {
      await finesApi.createCategory(form.value);
    }
    toast.add({ severity: 'success', summary: 'Gespeichert', life: 2000 });
    showDialog.value = false;
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    saving.value = false;
  }
}

async function deleteCategory(id: string) {
  await finesApi.deleteCategory(id);
  toast.add({ severity: 'info', summary: 'Deaktiviert', life: 2000 });
  load();
}

onMounted(load);
</script>

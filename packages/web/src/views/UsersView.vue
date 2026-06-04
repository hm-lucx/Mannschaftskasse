<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <Button label="Neuer Spieler" icon="pi pi-plus" size="small" @click="openCreate" />
    </div>

    <div class="bg-white rounded-xl shadow-sm">
      <DataTable :value="users" :loading="loading" stripedRows>
        <Column header="Name">
          <template #body="{ data }">
            <div class="font-medium">{{ data.first_name }} {{ data.last_name }}</div>
          </template>
        </Column>
        <Column header="E-Mail" field="email" />
        <Column header="Rollen">
          <template #body="{ data }">
            <div class="flex gap-1 flex-wrap">
              <span
                v-for="role in (data.userRoles || [])"
                :key="role.id"
                class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
              >
                {{ role.role?.name }}
              </span>
            </div>
          </template>
        </Column>
        <Column header="Status">
          <template #body="{ data }">
            <span :class="data.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'" class="text-sm">
              {{ data.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv' }}
            </span>
          </template>
        </Column>
        <Column>
          <template #body="{ data }">
            <Button v-if="data.status === 'ACTIVE'"
              icon="pi pi-user-minus" text size="small" severity="danger"
              title="Deaktivieren"
              @click="deactivate(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="showDialog" header="Neuer Spieler" modal class="w-full max-w-lg">
      <div class="grid grid-cols-2 gap-4 p-1">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
          <InputText v-model="form.first_name" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nachname</label>
          <InputText v-model="form.last_name" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
          <InputText v-model="form.email" type="email" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <InputText v-model="form.phone" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Trikotnummer</label>
          <InputNumber v-model="form.shirt_number" :min="1" :max="99" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
          <Select v-model="form.role" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
          <InputText v-model="form.password" type="password" class="w-full" placeholder="Test1234!" />
        </div>
      </div>
      <template #footer>
        <Button label="Abbrechen" text severity="secondary" @click="showDialog = false" />
        <Button label="Erstellen" icon="pi pi-check" :loading="saving" @click="createUser" />
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
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { usersApi } from '@/api/users.api';
import type { User } from '@/types';

const toast = useToast();
const users = ref<User[]>([]);
const loading = ref(true);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ first_name: '', last_name: '', email: '', phone: '', shirt_number: null as number | null, role: 'PLAYER', password: '' });

const roleOptions = [
  { label: 'Spieler', value: 'PLAYER' },
  { label: 'Trainer', value: 'COACH' },
  { label: 'Kassenwart', value: 'TREASURER' },
  { label: 'Admin', value: 'ADMIN' },
];

async function load() {
  loading.value = true;
  try {
    users.value = await usersApi.list();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.value = { first_name: '', last_name: '', email: '', phone: '', shirt_number: null, role: 'PLAYER', password: '' };
  showDialog.value = true;
}

async function createUser() {
  if (!form.value.first_name || !form.value.email) {
    toast.add({ severity: 'warn', summary: 'Pflichtfelder fehlen', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    await usersApi.create({ ...form.value, roles: [form.value.role] });
    toast.add({ severity: 'success', summary: 'Spieler erstellt', life: 2000 });
    showDialog.value = false;
    load();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: e.response?.data?.message || 'Fehler', life: 4000 });
  } finally {
    saving.value = false;
  }
}

async function deactivate(id: string) {
  await usersApi.deactivate(id);
  toast.add({ severity: 'info', summary: 'Deaktiviert', life: 2000 });
  load();
}

onMounted(load);
</script>

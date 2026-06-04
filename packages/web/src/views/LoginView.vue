<template>
  <div class="bg-white rounded-2xl shadow-2xl p-8">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Anmelden</h2>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
        <InputText
          v-model="email"
          type="email"
          placeholder="name@schwand.at"
          class="w-full"
          :disabled="loading"
          autofocus
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
        <Password
          v-model="password"
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
          :disabled="loading"
          @keyup.enter="handleLogin"
        />
      </div>

      <div v-if="error" class="text-red-600 text-sm bg-red-50 rounded-lg p-3">
        {{ error }}
      </div>

      <Button
        type="submit"
        label="Anmelden"
        icon="pi pi-sign-in"
        class="w-full"
        :loading="loading"
      />
    </form>

    <div class="mt-6 pt-4 border-t border-gray-100">
      <p class="text-xs text-gray-400 text-center">Testzugänge (Passwort: Test1234!)</p>
      <div class="mt-2 space-y-1">
        <button
          v-for="acc in testAccounts"
          :key="acc.email"
          class="w-full text-left text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-500 flex justify-between"
          type="button"
          @click="fillAccount(acc)"
        >
          <span>{{ acc.email }}</span>
          <span class="text-blue-500">{{ acc.role }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const testAccounts = [
  { email: 'admin@schwand.at', role: 'Admin' },
  { email: 'trainer@schwand.at', role: 'Trainer' },
  { email: 'spieler1@schwand.at', role: 'Spieler' },
  { email: 'kassenwart@schwand.at', role: 'Kassenwart' },
];

function fillAccount(acc: { email: string; role: string }) {
  email.value = acc.email;
  password.value = 'Test1234!';
}

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Bitte E-Mail und Passwort eingeben.';
    return;
  }
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);

    // Role-based redirect
    if (auth.isAdmin.value) {
      router.push('/admin/users');
    } else if (auth.isCoach.value) {
      router.push('/calendar');
    } else {
      router.push('/dashboard');
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Anmeldung fehlgeschlagen.';
  } finally {
    loading.value = false;
  }
}
</script>

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth.api';
import type { User } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  const hasRole = (role: string) => user.value?.roles?.includes(role) ?? false;
  const hasAnyRole = (...roles: string[]) => roles.some((r) => hasRole(r));

  const isAdmin = computed(() => hasRole('ADMIN'));
  const isCoach = computed(() => hasRole('COACH'));
  const isPlayer = computed(() => hasRole('PLAYER'));
  const isTreasurer = computed(() => hasRole('TREASURER'));

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const data = await authApi.login(email, password);
      accessToken.value = data.accessToken;
      user.value = data.user;
      localStorage.setItem('access_token', data.accessToken);
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {}
    accessToken.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
  }

  function setUser(u: User) {
    user.value = u;
  }

  return {
    user,
    accessToken,
    loading,
    isAuthenticated,
    isAdmin,
    isCoach,
    isPlayer,
    isTreasurer,
    hasRole,
    hasAnyRole,
    login,
    logout,
    setUser,
  };
});

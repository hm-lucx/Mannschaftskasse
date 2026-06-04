import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        { path: '', name: 'login', component: () => import('@/views/LoginView.vue') },
      ],
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue') },
        { path: 'events/:id', name: 'event-detail', component: () => import('@/views/EventDetailView.vue') },
        { path: 'fines', name: 'fines', component: () => import('@/views/FinesView.vue') },
        { path: 'fines/catalog', name: 'fine-catalog', component: () => import('@/views/FineCatalogView.vue'), meta: { roles: ['ADMIN', 'COACH'] } },
        { path: 'payments', name: 'payments', component: () => import('@/views/PaymentsView.vue'), meta: { roles: ['ADMIN', 'TREASURER'] } },
        { path: 'ledger', name: 'ledger', component: () => import('@/views/LedgerView.vue'), meta: { roles: ['ADMIN', 'TREASURER'] } },
        { path: 'reports', name: 'reports', component: () => import('@/views/ReportsView.vue'), meta: { roles: ['ADMIN', 'COACH', 'TREASURER'] } },
        { path: 'standings', name: 'standings', component: () => import('@/views/StandingsView.vue') },
        { path: 'admin/users', name: 'admin-users', component: () => import('@/views/UsersView.vue'), meta: { roles: ['ADMIN'] } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login');
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return next('/dashboard');
  }

  if (to.meta.roles) {
    const requiredRoles = to.meta.roles as string[];
    const ok = requiredRoles.some((r) => auth.hasRole(r));
    if (!ok) return next('/dashboard');
  }

  next();
});

export default router;

import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import StatsView from '../views/StatsView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import TransactionFormView from '../views/TransactionFormView.vue'
import SettingsView from '../views/SettingsView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/transactions', name: 'transactions', component: TransactionsView },
    { path: '/ajouter', name: 'add', component: TransactionFormView },
    { path: '/modifier/:id', name: 'edit', component: TransactionFormView },
    { path: '/reglages', name: 'settings', component: SettingsView }
  ]
})

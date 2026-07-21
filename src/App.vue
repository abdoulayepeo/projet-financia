<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import {
  Wallet,
  Sun,
  Moon,
  PieChart,
  BarChart3,
  Plus,
  ReceiptText,
  Settings
} from 'lucide-vue-next'
import { useTheme } from './composables/useTheme'
import { useCategoriesStore } from './stores/categories'
import { useRecurringsStore } from './stores/recurrings'
import { useTransactionsStore } from './stores/transactions'

const { theme, toggle } = useTheme()
const categories = useCategoriesStore()
const recurrings = useRecurringsStore()
const transactions = useTransactionsStore()

onMounted(async () => {
  await categories.load()
  await recurrings.applyDue()
  await transactions.load()
})
</script>

<template>
  <div class="app">
    <header class="app-bar">
      <div class="brand">
        <span class="brand-icon"><Wallet :size="18" /></span>
        Financia
      </div>
      <button
        class="theme-toggle"
        type="button"
        :aria-label="theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
        @click="toggle"
      >
        <Sun v-if="theme === 'dark'" :size="18" />
        <Moon v-else :size="18" />
      </button>
    </header>

    <main class="content">
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink to="/" class="nav-item">
        <PieChart :size="20" />
        <span>Accueil</span>
      </RouterLink>
      <RouterLink to="/stats" class="nav-item">
        <BarChart3 :size="20" />
        <span>Stats</span>
      </RouterLink>
      <RouterLink to="/ajouter" class="nav-item nav-add" aria-label="Ajouter une transaction">
        <span class="nav-add-btn"><Plus :size="26" /></span>
      </RouterLink>
      <RouterLink to="/transactions" class="nav-item">
        <ReceiptText :size="20" />
        <span>Historique</span>
      </RouterLink>
      <RouterLink to="/reglages" class="nav-item">
        <Settings :size="20" />
        <span>Réglages</span>
      </RouterLink>
    </nav>
  </div>
</template>

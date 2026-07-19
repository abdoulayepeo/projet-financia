<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRecurringsStore } from './stores/recurrings'
import { useTransactionsStore } from './stores/transactions'

const recurrings = useRecurringsStore()
const transactions = useTransactionsStore()

onMounted(async () => {
  await recurrings.applyDue()
  await transactions.load()
})
</script>

<template>
  <div class="app">
    <main class="content">
      <RouterView />
    </main>
    <nav class="bottom-nav">
      <RouterLink to="/" class="nav-item">
        <span class="nav-icon">📊</span>
        <span>Accueil</span>
      </RouterLink>
      <RouterLink to="/stats" class="nav-item">
        <span class="nav-icon">📈</span>
        <span>Stats</span>
      </RouterLink>
      <RouterLink to="/ajouter" class="nav-item nav-add" aria-label="Ajouter une transaction">
        <span class="nav-add-btn">＋</span>
      </RouterLink>
      <RouterLink to="/transactions" class="nav-item">
        <span class="nav-icon">🧾</span>
        <span>Historique</span>
      </RouterLink>
      <RouterLink to="/reglages" class="nav-item">
        <span class="nav-icon">⚙️</span>
        <span>Réglages</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <main class="content">
      <RouterView />
    </main>
    <nav class="bottom-nav">
      <RouterLink to="/" class="nav-item">
        <span class="nav-icon">📊</span>
        <span>Tableau de bord</span>
      </RouterLink>
      <RouterLink to="/ajouter" class="nav-item nav-add" aria-label="Ajouter une transaction">
        <span class="nav-add-btn">＋</span>
      </RouterLink>
      <RouterLink to="/transactions" class="nav-item">
        <span class="nav-icon">🧾</span>
        <span>Transactions</span>
      </RouterLink>
    </nav>
  </div>
</template>

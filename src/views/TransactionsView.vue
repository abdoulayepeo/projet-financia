<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import { formatAmount, formatDay } from '../lib/format'
import { colorFor } from '../categories'
import MonthPicker from '../components/MonthPicker.vue'
import type { Transaction } from '../db'

const store = useTransactionsStore()
onMounted(() => store.load())

const groupedByDay = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const t of store.transactions) {
    const list = groups.get(t.date) ?? []
    list.push(t)
    groups.set(t.date, list)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})

async function removeTransaction(t: Transaction) {
  if (confirm(`Supprimer « ${t.category} — ${formatAmount(t.amount)} » ?`)) {
    await store.remove(t.id)
  }
}
</script>

<template>
  <h1>Transactions</h1>
  <MonthPicker :model-value="store.month" @update:model-value="store.setMonth" />

  <section v-for="[date, items] in groupedByDay" :key="date" class="day-group">
    <h2 class="day-title">{{ formatDay(date) }}</h2>
    <ul class="tx-list">
      <li v-for="t in items" :key="t.id" class="card tx">
        <span class="dot" :style="{ background: t.type === 'income' ? '#22c55e' : colorFor(t.category) }"></span>
        <div class="tx-info">
          <span class="tx-category">{{ t.category }}</span>
          <span v-if="t.note" class="tx-note">{{ t.note }}</span>
        </div>
        <strong :class="t.type === 'income' ? 'income' : 'expense'">
          {{ t.type === 'income' ? '+' : '−' }}{{ formatAmount(t.amount) }}
        </strong>
        <button type="button" class="tx-delete" aria-label="Supprimer" @click="removeTransaction(t)">
          ✕
        </button>
      </li>
    </ul>
  </section>

  <p v-if="!store.transactions.length" class="empty">Aucune transaction ce mois-ci.</p>
</template>

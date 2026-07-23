<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import { useTransactionsStore } from '../stores/transactions'
import { useCategoriesStore } from '../stores/categories'
import { formatAmount, formatDay } from '../lib/format'
import MonthPicker from '../components/MonthPicker.vue'
import { useDialog } from '../composables/dialog'
import type { Transaction } from '../db'

const router = useRouter()
const store = useTransactionsStore()
const cats = useCategoriesStore()
const dialog = useDialog()

onMounted(() => {
  store.load()
  cats.load()
})

const groupedByDay = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const t of store.transactions) {
    const list = groups.get(t.date) ?? []
    list.push(t)
    groups.set(t.date, list)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})

function dayNet(items: Transaction[]): number {
  return items.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
}

function edit(t: Transaction) {
  router.push(`/modifier/${t.id}`)
}

async function removeTransaction(t: Transaction) {
  const ok = await dialog.confirm({
    title: 'Supprimer cette transaction ?',
    message: `${t.note || t.category} — ${formatAmount(t.amount)}`,
    confirmLabel: 'Supprimer',
    danger: true
  })
  if (ok) await store.remove(t.id)
}
</script>

<template>
  <h1>Transactions</h1>
  <MonthPicker :model-value="store.month" @update:model-value="store.setMonth" />
  <p v-if="store.transactions.length" class="hint centered">Touche une transaction pour la modifier.</p>

  <section v-for="[date, items] in groupedByDay" :key="date" class="day-group">
    <h2 class="day-title">
      {{ formatDay(date) }}
      <span class="day-net" :class="dayNet(items) >= 0 ? 'income' : 'expense'">
        {{ dayNet(items) >= 0 ? '+' : '' }}{{ formatAmount(dayNet(items)) }}
      </span>
    </h2>
    <ul class="tx-list">
      <li v-for="t in items" :key="t.id" class="card tx" @click="edit(t)">
        <span class="dot" :style="{ background: t.type === 'income' ? 'var(--income)' : cats.colorOf(t.category) }"></span>
        <div class="tx-info">
          <span class="tx-category">{{ t.note || t.category }}</span>
          <span v-if="t.note" class="tx-note">{{ t.category }}</span>
        </div>
        <strong class="tx-amount" :class="t.type === 'income' ? 'income' : 'expense'">
          {{ t.type === 'income' ? '+' : '−' }}{{ formatAmount(t.amount) }}
        </strong>
        <button type="button" class="icon-btn danger" aria-label="Supprimer la transaction" @click.stop="removeTransaction(t)">
          <Trash2 :size="18" />
        </button>
      </li>
    </ul>
  </section>

  <p v-if="!store.transactions.length" class="empty">Aucune transaction ce mois-ci.</p>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import { useBudgetsStore } from '../stores/budgets'
import { formatAmount } from '../lib/format'
import { colorFor } from '../categories'
import MonthPicker from '../components/MonthPicker.vue'
import CategoryChart from '../components/CategoryChart.vue'

const store = useTransactionsStore()
const budgets = useBudgetsStore()

onMounted(() => {
  store.load()
  budgets.load()
})

const budgetRows = computed(() =>
  Object.entries(budgets.budgets)
    .map(([category, limit]) => {
      const spent = store.expensesByCategory.find((c) => c.category === category)?.total ?? 0
      return { category, limit, spent, ratio: spent / limit }
    })
    .sort((a, b) => b.ratio - a.ratio)
)
</script>

<template>
  <h1>Financia</h1>
  <MonthPicker :model-value="store.month" @update:model-value="store.setMonth" />

  <section class="stats">
    <div class="card stat">
      <span class="stat-label">Revenus</span>
      <strong class="income">{{ formatAmount(store.totalIncome) }}</strong>
    </div>
    <div class="card stat">
      <span class="stat-label">Dépenses</span>
      <strong class="expense">{{ formatAmount(store.totalExpense) }}</strong>
    </div>
    <div class="card stat stat-balance">
      <span class="stat-label">Solde du mois</span>
      <strong :class="store.balance >= 0 ? 'income' : 'expense'">
        {{ formatAmount(store.balance) }}
      </strong>
    </div>
  </section>

  <section v-if="budgetRows.length" class="card">
    <h2>Budgets</h2>
    <div v-for="b in budgetRows" :key="b.category" class="budget-row">
      <div class="budget-head">
        <span>{{ b.category }}</span>
        <span :class="{ expense: b.ratio > 1 }">
          {{ formatAmount(b.spent) }} / {{ formatAmount(b.limit) }}
        </span>
      </div>
      <div class="budget-bar">
        <div
          class="budget-fill"
          :class="{ warn: b.ratio >= 0.8 && b.ratio <= 1, over: b.ratio > 1 }"
          :style="{ width: Math.min(b.ratio, 1) * 100 + '%' }"
        ></div>
      </div>
      <span v-if="b.ratio > 1" class="budget-alert">⚠️ Budget dépassé !</span>
    </div>
  </section>

  <section v-if="store.expensesByCategory.length" class="card">
    <h2>Dépenses par catégorie</h2>
    <CategoryChart :data="store.expensesByCategory" />
    <ul class="cat-list">
      <li v-for="c in store.expensesByCategory" :key="c.category">
        <span class="dot" :style="{ background: colorFor(c.category) }"></span>
        <span class="cat-name">{{ c.category }}</span>
        <span class="cat-total">{{ formatAmount(c.total) }}</span>
      </li>
    </ul>
  </section>

  <p v-else class="empty">
    Aucune dépense ce mois-ci.<br />
    Ajoute ta première transaction avec le bouton ＋
  </p>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { db } from '../db'
import { formatAmount } from '../lib/format'
import { useTheme } from '../composables/useTheme'

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const { theme } = useTheme()
const year = ref(new Date().getFullYear())
const income = ref<number[]>(Array(12).fill(0))
const expense = ref<number[]>(Array(12).fill(0))

async function load() {
  const rows = await db.transactions.where('date').startsWith(`${year.value}-`).toArray()
  const inc = Array(12).fill(0)
  const exp = Array(12).fill(0)
  for (const t of rows) {
    const m = Number(t.date.slice(5, 7)) - 1
    if (t.type === 'income') inc[m] += t.amount
    else exp[m] += t.amount
  }
  income.value = inc
  expense.value = exp
}

onMounted(load)
watch(year, load)

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => {
  // dépend de `theme` pour recalculer les couleurs au changement de thème
  void theme.value
  return {
    labels: MONTH_LABELS,
    datasets: [
      { label: 'Revenus', data: income.value, backgroundColor: cssVar('--income'), borderRadius: 4 },
      { label: 'Dépenses', data: expense.value, backgroundColor: cssVar('--expense'), borderRadius: 4 }
    ]
  }
})

const options = computed(() => {
  void theme.value
  const muted = cssVar('--text-muted')
  const text = cssVar('--text')
  const grid = cssVar('--border')
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: muted } },
      y: { ticks: { color: muted }, grid: { color: grid } }
    },
    plugins: { legend: { labels: { color: text } } }
  } as const
})

const totalIncome = computed(() => income.value.reduce((a, b) => a + b, 0))
const totalExpense = computed(() => expense.value.reduce((a, b) => a + b, 0))
const balance = computed(() => totalIncome.value - totalExpense.value)
</script>

<template>
  <h1>Statistiques</h1>

  <div class="month-picker">
    <button type="button" @click="year--" aria-label="Année précédente"><ChevronLeft :size="20" /></button>
    <span class="month-label">{{ year }}</span>
    <button type="button" @click="year++" aria-label="Année suivante"><ChevronRight :size="20" /></button>
  </div>

  <section class="card">
    <h2>Revenus et dépenses par mois</h2>
    <div class="chart-wrap chart-tall">
      <Bar :data="chartData" :options="options" />
    </div>
  </section>

  <section class="stats">
    <div class="card stat">
      <span class="stat-label">Revenus {{ year }}</span>
      <strong class="income">{{ formatAmount(totalIncome) }}</strong>
    </div>
    <div class="card stat">
      <span class="stat-label">Dépenses {{ year }}</span>
      <strong class="expense">{{ formatAmount(totalExpense) }}</strong>
    </div>
    <div class="card stat stat-balance">
      <span class="stat-label">Solde de l'année</span>
      <strong>{{ formatAmount(balance) }}</strong>
    </div>
  </section>
</template>

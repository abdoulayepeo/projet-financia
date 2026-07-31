<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js'
import { BarChart3, ChevronLeft, ChevronRight, LineChart, Sparkles } from 'lucide-vue-next'
import { db, type Transaction } from '../db'
import { formatAmount, formatMonth } from '../lib/format'
import { useTheme } from '../composables/useTheme'
import { useGoalsStore } from '../stores/goals'
import { useCategoriesStore } from '../stores/categories'

Chart.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip)

const { theme } = useTheme()
const goals = useGoalsStore()
const cats = useCategoriesStore()
const year = ref(new Date().getFullYear())
const rows = ref<Transaction[]>([])

async function load() {
  rows.value = await db.transactions.where('date').startsWith(`${year.value}-`).toArray()
}

onMounted(() => {
  load()
  goals.load()
  cats.load()
})
watch(year, load)

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function monthKey(m: number) {
  return `${year.value}-${String(m + 1).padStart(2, '0')}`
}

const income = computed(() => {
  const arr = Array(12).fill(0)
  for (const t of rows.value) if (t.type === 'income') arr[Number(t.date.slice(5, 7)) - 1] += t.amount
  return arr
})

const expense = computed(() => {
  const arr = Array(12).fill(0)
  for (const t of rows.value) if (t.type === 'expense') arr[Number(t.date.slice(5, 7)) - 1] += t.amount
  return arr
})

const savingsByMonth = computed(() => {
  const arr = Array(12).fill(0)
  for (const c of goals.contributions) {
    if (c.date.startsWith(`${year.value}-`)) arr[Number(c.date.slice(5, 7)) - 1] += c.amount
  }
  return arr
})

/** Mois qui contiennent réellement quelque chose. */
const activeMonths = computed(() => {
  const out: number[] = []
  for (let m = 0; m < 12; m++) {
    if (income.value[m] || expense.value[m] || savingsByMonth.value[m]) out.push(m)
  }
  return out
})

/**
 * Trois lectures selon la quantité de données : rien, un seul mois (le
 * graphique annuel serait onze colonnes vides), ou une vraie comparaison.
 */
const mode = computed<'empty' | 'solo' | 'full'>(() => {
  if (activeMonths.value.length === 0) return 'empty'
  return activeMonths.value.length === 1 ? 'solo' : 'full'
})

// ===== Mode comparaison =====

/** On ne trace que la plage réellement utilisée, avec 3 colonnes minimum. */
const range = computed(() => {
  const a = activeMonths.value
  const first = a[0] ?? 0
  const last = a[a.length - 1] ?? 11
  const from = Math.max(0, Math.min(first, last - 2))
  const to = Math.min(11, Math.max(last, from + 2))
  return { from, to }
})

const chartData = computed(() => {
  // dépend de `theme` pour recalculer les couleurs au changement de thème
  void theme.value
  const { from, to } = range.value
  const slice = (arr: number[]) => arr.slice(from, to + 1)
  return {
    labels: MONTH_LABELS.slice(from, to + 1),
    datasets: [
      { label: 'Revenus', data: slice(income.value), backgroundColor: cssVar('--income'), borderRadius: 4 },
      { label: 'Dépenses', data: slice(expense.value), backgroundColor: cssVar('--expense'), borderRadius: 4 },
      { label: 'Épargne', data: slice(savingsByMonth.value), backgroundColor: cssVar('--primary'), borderRadius: 4 }
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
const savedThisYear = computed(() => goals.savedInYear(year.value))
const balance = computed(() => totalIncome.value - totalExpense.value - savedThisYear.value)

/** Dépense moyenne calculée sur les mois utilisés, pas sur douze. */
const avgExpense = computed(() =>
  activeMonths.value.length ? totalExpense.value / activeMonths.value.length : 0
)

const busiestMonth = computed(() => {
  let best = -1
  for (const m of activeMonths.value) if (best < 0 || expense.value[m] > expense.value[best]) best = m
  return best
})

/** Part des revenus mise de côté sur l'année. */
const savingRate = computed(() =>
  totalIncome.value > 0 ? Math.round((savedThisYear.value / totalIncome.value) * 100) : 0
)

/** Écart de dépenses entre les deux derniers mois utilisés. */
const trend = computed(() => {
  const a = activeMonths.value
  if (a.length < 2) return null
  const last = expense.value[a[a.length - 1]]
  const prev = expense.value[a[a.length - 2]]
  if (!prev) return null
  const delta = Math.round(((last - prev) / prev) * 100)
  return { delta, month: a[a.length - 1] }
})

// ===== Mode « un seul mois » =====

const soloMonth = computed(() => activeMonths.value[0] ?? 0)

const soloCategories = computed(() => {
  const m = soloMonth.value
  const totals = new Map<string, number>()
  for (const t of rows.value) {
    if (t.type !== 'expense' || Number(t.date.slice(5, 7)) - 1 !== m) continue
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
  }
  const max = Math.max(0, ...totals.values())
  return [...totals.entries()]
    .map(([category, total]) => ({
      category,
      total,
      color: cats.colorOf(category),
      ratio: max > 0 ? total / max : 0
    }))
    .sort((a, b) => b.total - a.total)
})

const soloBalance = computed(
  () => income.value[soloMonth.value] - expense.value[soloMonth.value] - savingsByMonth.value[soloMonth.value]
)
</script>

<template>
  <h1>Statistiques</h1>

  <div class="month-picker">
    <button type="button" @click="year--" aria-label="Année précédente"><ChevronLeft :size="20" /></button>
    <span class="month-label">{{ year }}</span>
    <button type="button" @click="year++" aria-label="Année suivante"><ChevronRight :size="20" /></button>
  </div>

  <!-- Aucune donnée sur l'année -->
  <template v-if="mode === 'empty'">
    <div class="empty-state">
      <div class="empty-illustration"><BarChart3 :size="34" /></div>
      <h3>Rien à analyser en {{ year }}</h3>
      <p>
        Ajoute des transactions et tes statistiques se construisent toutes seules.
        Tu peux aussi changer d'année avec les flèches ci-dessus.
      </p>
    </div>
  </template>

  <!-- Un seul mois : on montre ce mois en détail plutôt qu'un graphique creux -->
  <template v-else-if="mode === 'solo'">
    <section class="card stat stat-balance">
      <span class="stat-label">Solde de {{ formatMonth(monthKey(soloMonth)) }}</span>
      <strong>{{ formatAmount(soloBalance) }}</strong>
      <span v-if="savingsByMonth[soloMonth] > 0" class="stat-sub">après épargne</span>
    </section>

    <section class="stats">
      <div class="card stat">
        <span class="stat-label">Revenus</span>
        <strong class="income">{{ formatAmount(income[soloMonth]) }}</strong>
      </div>
      <div class="card stat">
        <span class="stat-label">Dépenses</span>
        <strong class="expense">{{ formatAmount(expense[soloMonth]) }}</strong>
      </div>
    </section>

    <section v-if="soloCategories.length" class="card">
      <h2>Tes plus grosses dépenses</h2>
      <div v-for="c in soloCategories" :key="c.category" class="rank-row">
        <div class="rank-head">
          <span><span class="dot" :style="{ background: c.color }"></span>{{ c.category }}</span>
          <strong>{{ formatAmount(c.total) }}</strong>
        </div>
        <div class="budget-bar">
          <div class="budget-fill" :style="{ width: c.ratio * 100 + '%', background: c.color }"></div>
        </div>
      </div>
    </section>

    <section class="card teaser">
      <div class="teaser-ic"><LineChart :size="22" /></div>
      <div>
        <strong>La comparaison arrive au mois prochain</strong>
        <p>
          Dès que tu auras un deuxième mois d'historique, cette page affichera ton
          évolution mois par mois, ta dépense moyenne et ton taux d'épargne.
        </p>
      </div>
    </section>
  </template>

  <!-- Plusieurs mois : comparaison + lectures utiles -->
  <template v-else>
    <section class="card">
      <h2>Revenus et dépenses par mois</h2>
      <div class="chart-wrap chart-tall">
        <Bar :data="chartData" :options="options" />
      </div>
    </section>

    <section class="card insights">
      <h2><Sparkles :size="16" style="vertical-align: -3px" /> Ce qu'on en retient</h2>
      <ul>
        <li>
          <span class="insight-label">Dépense moyenne</span>
          <strong>{{ formatAmount(avgExpense) }} / mois</strong>
          <span class="insight-sub">sur {{ activeMonths.length }} mois d'activité</span>
        </li>
        <li v-if="busiestMonth >= 0">
          <span class="insight-label">Mois le plus dépensier</span>
          <strong class="capitalize">{{ formatMonth(monthKey(busiestMonth)) }}</strong>
          <span class="insight-sub">{{ formatAmount(expense[busiestMonth]) }}</span>
        </li>
        <li v-if="savedThisYear > 0">
          <span class="insight-label">Taux d'épargne</span>
          <strong style="color: var(--primary)">{{ savingRate }} %</strong>
          <span class="insight-sub">de tes revenus mis de côté</span>
        </li>
        <li v-if="trend">
          <span class="insight-label">Tendance</span>
          <strong :class="trend.delta > 0 ? 'expense' : 'income'">
            {{ trend.delta > 0 ? '+' : '' }}{{ trend.delta }} %
          </strong>
          <span class="insight-sub">de dépenses par rapport au mois précédent</span>
        </li>
      </ul>
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
      <div class="card stat">
        <span class="stat-label">Épargne {{ year }}</span>
        <strong style="color: var(--primary)">{{ formatAmount(savedThisYear) }}</strong>
      </div>
      <div class="card stat stat-balance stat-half">
        <span class="stat-label">Solde de l'année</span>
        <strong>{{ formatAmount(balance) }}</strong>
        <span v-if="savedThisYear > 0" class="stat-sub">après épargne</span>
      </div>
    </section>
  </template>
</template>

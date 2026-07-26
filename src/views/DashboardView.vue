<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TrendingUp, TrendingDown, Target, ChevronRight, TriangleAlert, Wallet } from 'lucide-vue-next'
import { useTransactionsStore } from '../stores/transactions'
import { useBudgetsStore } from '../stores/budgets'
import { useCategoriesStore } from '../stores/categories'
import { useGoalsStore } from '../stores/goals'
import { formatAmount } from '../lib/format'
import MonthPicker from '../components/MonthPicker.vue'
import CategoryChart from '../components/CategoryChart.vue'
import Skeleton from '../components/Skeleton.vue'

const router = useRouter()
const store = useTransactionsStore()
const budgets = useBudgetsStore()
const categories = useCategoriesStore()
const goals = useGoalsStore()

onMounted(() => {
  store.load()
  budgets.load()
  categories.load()
  goals.load()
})

const ready = computed(() => store.hasLoaded && goals.hasLoaded)

const savedThisMonth = computed(() => goals.savedInMonth(store.month))
const available = computed(() => store.balance - savedThisMonth.value)

// Répartition des sorties du mois : dépenses par catégorie + épargne, avec %.
const EPARGNE_COLOR = '#a05fae'

const outflow = computed(() => {
  const items = store.expensesByCategory.map((c) => ({
    category: c.category,
    total: c.total,
    color: categories.colorOf(c.category)
  }))
  if (savedThisMonth.value > 0) {
    items.push({ category: 'Épargne', total: savedThisMonth.value, color: EPARGNE_COLOR })
  }
  const sum = items.reduce((s, i) => s + i.total, 0)
  return items
    .map((i) => ({ ...i, pct: sum > 0 ? Math.round((i.total / sum) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
})

const budgetRows = computed(() =>
  Object.entries(budgets.budgets)
    .map(([category, limit]) => {
      const spent = store.expensesByCategory.find((c) => c.category === category)?.total ?? 0
      return { category, limit, spent, ratio: spent / limit }
    })
    .sort((a, b) => b.ratio - a.ratio)
)

const goalRows = computed(() =>
  goals.goals.map((g) => {
    const saved = goals.savedFor(g.id)
    return { goal: g, saved, ratio: g.target > 0 ? saved / g.target : 0, reached: saved >= g.target }
  })
)

// ===== Anneau de focus =====
// Met en avant automatiquement ce qui mérite le plus l'attention ce mois-ci :
// un budget dépassé > un budget qui s'approche de sa limite > l'objectif le
// plus avancé. Rien à signaler → la carte ne s'affiche pas.
const RING_CIRCUMFERENCE = 2 * Math.PI * 52

interface FocusItem {
  kind: 'over' | 'warn' | 'goal'
  color: string
  percent: number
  title: string
  subtitle: string
  goalId?: number
}

const focus = computed<FocusItem | null>(() => {
  const over = budgetRows.value.filter((b) => b.ratio > 1).sort((a, b) => b.ratio - a.ratio)[0]
  if (over) {
    return {
      kind: 'over',
      color: 'var(--expense)',
      percent: over.ratio * 100,
      title: over.category,
      subtitle: `Dépassé de +${formatAmount(over.spent - over.limit)}`
    }
  }
  const warn = budgetRows.value.filter((b) => b.ratio >= 0.8).sort((a, b) => b.ratio - a.ratio)[0]
  if (warn) {
    return {
      kind: 'warn',
      color: 'var(--accent)',
      percent: warn.ratio * 100,
      title: warn.category,
      subtitle: `${formatAmount(warn.spent)} / ${formatAmount(warn.limit)}`
    }
  }
  const goal = goalRows.value.filter((g) => !g.reached).sort((a, b) => b.ratio - a.ratio)[0]
  if (goal) {
    return {
      kind: 'goal',
      color: goal.goal.color,
      percent: goal.ratio * 100,
      title: goal.goal.name,
      subtitle: `${formatAmount(goal.saved)} / ${formatAmount(goal.goal.target)}`,
      goalId: goal.goal.id
    }
  }
  return null
})

function ringOffset(percent: number): number {
  const clamped = Math.min(Math.max(percent, 0), 100)
  return RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * clamped) / 100
}

function openFocus() {
  if (focus.value?.kind === 'goal' && focus.value.goalId) {
    router.push(`/objectifs/${focus.value.goalId}`)
  } else {
    router.push('/reglages')
  }
}
</script>

<template>
  <MonthPicker :model-value="store.month" @update:model-value="store.setMonth" />

  <!-- Squelettes pendant le premier chargement -->
  <template v-if="!ready">
    <div class="card balance-hero" style="background: var(--surface-2)">
      <Skeleton width="7rem" height="0.7rem" />
      <Skeleton width="60%" height="1.9rem" />
      <Skeleton width="45%" height="0.8rem" />
      <div class="balance-hero-divider"></div>
      <div style="display: flex; gap: 1rem">
        <Skeleton width="45%" height="0.9rem" />
        <Skeleton width="45%" height="0.9rem" />
      </div>
    </div>
    <div class="card" style="display: flex; justify-content: center">
      <Skeleton width="120px" height="120px" radius="50%" />
    </div>
    <div class="card">
      <Skeleton width="6rem" height="1.1rem" />
      <div style="margin-top: 1rem"><Skeleton block height="0.9rem" /></div>
      <div style="margin-top: 0.9rem"><Skeleton block height="0.9rem" /></div>
    </div>
    <div class="card">
      <Skeleton width="10rem" height="1.1rem" />
      <div class="skeleton-donut" style="margin-top: 1rem"></div>
    </div>
  </template>

  <!-- Vraie interface -->
  <template v-else>
    <section class="card balance-hero">
      <span class="stat-label">Disponible ce mois</span>
      <strong class="balance-hero-amount">{{ formatAmount(available) }}</strong>
      <span v-if="savedThisMonth > 0" class="balance-hero-sub">
        dont {{ formatAmount(savedThisMonth) }} mis de côté
      </span>

      <div class="balance-hero-divider"></div>
      <div class="balance-hero-split">
        <div class="balance-hero-item">
          <span class="balance-hero-item-label"><TrendingUp :size="12" /> Revenus</span>
          <strong class="income">{{ formatAmount(store.totalIncome) }}</strong>
        </div>
        <div class="balance-hero-item">
          <span class="balance-hero-item-label"><TrendingDown :size="12" /> Dépenses</span>
          <strong class="expense">{{ formatAmount(store.totalExpense) }}</strong>
        </div>
      </div>
    </section>

    <section v-if="focus" class="card focus-card" @click="openFocus">
      <div class="focus-ring-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" stroke-width="10" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            :stroke="focus.color"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringOffset(focus.percent)"
            transform="rotate(-90 60 60)"
            class="focus-ring-bar"
          />
        </svg>
        <div class="focus-ring-center">
          <TriangleAlert v-if="focus.kind === 'over'" :size="18" :color="focus.color" />
          <Wallet v-else-if="focus.kind === 'warn'" :size="18" :color="focus.color" />
          <Target v-else :size="18" :color="focus.color" />
          <strong>{{ Math.round(focus.percent) }}%</strong>
        </div>
      </div>
      <div class="focus-text">
        <span class="focus-eyebrow">
          {{ focus.kind === 'over' ? 'Budget dépassé' : focus.kind === 'warn' ? 'Budget serré' : 'Objectif en cours' }}
        </span>
        <span class="focus-title">{{ focus.title }}</span>
        <span class="focus-sub" :class="{ expense: focus.kind === 'over' }">{{ focus.subtitle }}</span>
      </div>
      <ChevronRight :size="18" class="focus-chevron" />
    </section>

    <section class="card">
      <div class="card-head">
        <h2><Target :size="16" style="vertical-align: -3px" /> Objectifs</h2>
        <button type="button" class="link-btn" @click="router.push('/objectifs')">
          Gérer <ChevronRight :size="15" />
        </button>
      </div>

      <div v-if="goalRows.length" class="goal-carousel">
        <div
          v-for="r in goalRows"
          :key="r.goal.id"
          class="goal-chip-card"
          @click="router.push(`/objectifs/${r.goal.id}`)"
        >
          <div class="goal-chip-head">
            <span class="dot" :style="{ background: r.goal.color }"></span>
            <span class="goal-chip-name">{{ r.goal.name }}</span>
          </div>
          <div class="budget-bar goal-chip-bar">
            <div
              class="budget-fill"
              :class="{ over: r.reached }"
              :style="{ width: Math.min(r.ratio, 1) * 100 + '%', background: r.reached ? undefined : r.goal.color }"
            ></div>
          </div>
          <span class="goal-chip-amt" :class="{ income: r.reached }">
            {{ formatAmount(r.saved) }} / {{ formatAmount(r.goal.target) }}
          </span>
        </div>
      </div>
      <p v-else class="hint" style="margin: 0">
        Épargne pour tes projets (voyage, téléphone, permis…) et suis ta progression.
        Touche « Gérer » pour créer ton premier objectif.
      </p>
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
        <span v-if="b.ratio > 1" class="budget-alert">⚠️ Dépassé de +{{ formatAmount(b.spent - b.limit) }}</span>
      </div>
    </section>

    <section v-if="outflow.length" class="card">
      <h2>Où part ton argent</h2>
      <CategoryChart :data="outflow" />
      <ul class="cat-list">
        <li v-for="c in outflow" :key="c.category">
          <span class="dot" :style="{ background: c.color }"></span>
          <span class="cat-name">{{ c.category }}</span>
          <span class="cat-pct">{{ c.pct }} %</span>
          <span class="cat-total">{{ formatAmount(c.total) }}</span>
        </li>
      </ul>
    </section>

    <p v-else class="empty">
      Aucune dépense ni épargne ce mois-ci.<br />
      Ajoute ta première transaction avec le bouton ＋
    </p>
  </template>
</template>

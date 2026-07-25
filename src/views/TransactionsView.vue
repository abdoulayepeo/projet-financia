<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2, PiggyBank, ReceiptText, Plus } from 'lucide-vue-next'
import { useTransactionsStore } from '../stores/transactions'
import { useCategoriesStore } from '../stores/categories'
import { useGoalsStore } from '../stores/goals'
import { formatAmount, formatDay } from '../lib/format'
import MonthPicker from '../components/MonthPicker.vue'
import Skeleton from '../components/Skeleton.vue'
import { useDialog } from '../composables/dialog'

interface Entry {
  key: string
  date: string
  title: string
  subtitle?: string
  dotColor: string
  /** Impact sur le disponible du mois (signé) */
  effect: number
  kind: 'tx' | 'save'
  refId: number
  goalId?: number
}

const router = useRouter()
const store = useTransactionsStore()
const cats = useCategoriesStore()
const goals = useGoalsStore()
const dialog = useDialog()

onMounted(() => {
  store.load()
  cats.load()
  goals.load()
})

const ready = computed(() => store.hasLoaded && goals.hasLoaded)

const entries = computed<Entry[]>(() => {
  const txs: Entry[] = store.transactions.map((t) => ({
    key: `t${t.id}`,
    date: t.date,
    title: t.note || t.category,
    subtitle: t.note ? t.category : undefined,
    dotColor: t.type === 'income' ? 'var(--income)' : cats.colorOf(t.category),
    effect: t.type === 'income' ? t.amount : -t.amount,
    kind: 'tx',
    refId: t.id
  }))
  const saves: Entry[] = goals.contributions
    .filter((c) => c.date.startsWith(store.month))
    .map((c) => {
      const goal = goals.goals.find((g) => g.id === c.goalId)
      return {
        key: `s${c.id}`,
        date: c.date,
        title: c.amount >= 0 ? 'Mis de côté' : 'Retiré de la cagnotte',
        subtitle: goal ? `Objectif · ${goal.name}` : 'Objectif',
        dotColor: goal?.color ?? '#a05fae',
        effect: -c.amount,
        kind: 'save',
        refId: c.id,
        goalId: c.goalId
      }
    })
  return [...txs, ...saves]
})

const groupedByDay = computed(() => {
  const groups = new Map<string, Entry[]>()
  for (const e of entries.value) {
    const list = groups.get(e.date) ?? []
    list.push(e)
    groups.set(e.date, list)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
})

function dayNet(items: Entry[]): number {
  return items.reduce((sum, e) => sum + e.effect, 0)
}

function open(e: Entry) {
  if (e.kind === 'tx') router.push(`/modifier/${e.refId}`)
  else router.push(`/objectifs/${e.goalId}`)
}

async function removeEntry(e: Entry) {
  const ok = await dialog.confirm({
    title: e.kind === 'tx' ? 'Supprimer cette transaction ?' : 'Supprimer ce mouvement d’épargne ?',
    message: `${e.title} — ${formatAmount(Math.abs(e.effect))}`,
    confirmLabel: 'Supprimer',
    danger: true
  })
  if (!ok) return
  if (e.kind === 'tx') await store.remove(e.refId)
  else await goals.removeContribution(e.refId)
}
</script>

<template>
  <h1>Transactions</h1>
  <MonthPicker :model-value="store.month" @update:model-value="store.setMonth" />

  <!-- Squelettes -->
  <template v-if="!ready">
    <div v-for="i in 3" :key="i" class="card tx"><Skeleton width="0.7rem" height="0.7rem" radius="50%" /><div style="flex:1"><Skeleton width="8rem" height="1rem" /></div><Skeleton width="5rem" height="1rem" /></div>
  </template>

  <!-- État vide -->
  <template v-else-if="!entries.length">
    <div class="empty-state">
      <div class="empty-illustration"><ReceiptText :size="34" /></div>
      <h3>Aucun mouvement ce mois-ci</h3>
      <p>Commence par ajouter ton salaire ou une dépense pour voir apparaître ton historique.</p>
      <button type="button" class="submit-btn" @click="router.push('/ajouter')">
        <Plus :size="18" style="vertical-align: -3px" /> Ajouter une transaction
      </button>
    </div>
  </template>

  <!-- Historique -->
  <template v-else>
    <p class="hint centered">Touche une ligne pour la modifier.</p>
    <section v-for="[date, items] in groupedByDay" :key="date" class="day-group">
      <h2 class="day-title">
        {{ formatDay(date) }}
        <span class="day-net" :class="dayNet(items) >= 0 ? 'income' : 'expense'">
          {{ dayNet(items) >= 0 ? '+' : '' }}{{ formatAmount(dayNet(items)) }}
        </span>
      </h2>
      <ul class="tx-list">
        <li v-for="e in items" :key="e.key" class="card tx" @click="open(e)">
          <span class="dot" :style="{ background: e.dotColor }"></span>
          <div class="tx-info">
            <span class="tx-category">
              <PiggyBank v-if="e.kind === 'save'" :size="14" class="save-ic" />{{ e.title }}
            </span>
            <span v-if="e.subtitle" class="tx-note">{{ e.subtitle }}</span>
          </div>
          <strong class="tx-amount" :class="e.effect >= 0 ? 'income' : 'expense'">
            {{ e.effect >= 0 ? '+' : '−' }}{{ formatAmount(Math.abs(e.effect)) }}
          </strong>
          <button type="button" class="icon-btn danger" aria-label="Supprimer" @click.stop="removeEntry(e)">
            <Trash2 :size="18" />
          </button>
        </li>
      </ul>
    </section>
  </template>
</template>

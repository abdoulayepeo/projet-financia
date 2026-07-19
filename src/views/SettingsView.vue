<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { db } from '../db'
import { useBudgetsStore } from '../stores/budgets'
import { useRecurringsStore } from '../stores/recurrings'
import { useTransactionsStore } from '../stores/transactions'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../categories'
import { formatAmount, formatMonth } from '../lib/format'
import { downloadCsv } from '../lib/csv'

const budgets = useBudgetsStore()
const recurrings = useRecurringsStore()
const transactions = useTransactionsStore()

onMounted(() => {
  budgets.load()
  recurrings.load()
  transactions.load()
})

function onBudgetChange(category: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  budgets.set(category, Number.isFinite(value) && value > 0 ? value : null)
}

// Formulaire de nouvelle récurrence
const rType = ref<'expense' | 'income'>('expense')
const rAmount = ref<number | null>(null)
const rCategory = ref('')
const rDay = ref(1)
const rNote = ref('')

const rCategories = computed(() =>
  rType.value === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
)

function setRType(t: 'expense' | 'income') {
  rType.value = t
  rCategory.value = ''
}

async function addRecurring() {
  if (!rAmount.value || rAmount.value <= 0 || !rCategory.value) return
  await recurrings.add({
    type: rType.value,
    amount: rAmount.value,
    category: rCategory.value,
    dayOfMonth: Math.min(Math.max(Math.round(rDay.value) || 1, 1), 31),
    note: rNote.value.trim() || undefined
  })
  await transactions.load()
  rAmount.value = null
  rCategory.value = ''
  rDay.value = 1
  rNote.value = ''
}

async function removeRecurring(id: number) {
  if (confirm('Supprimer cette récurrence ? (les transactions déjà créées sont conservées)')) {
    await recurrings.remove(id)
  }
}

function exportMonth() {
  downloadCsv(transactions.transactions, `financia-${transactions.month}.csv`)
}

async function exportAll() {
  downloadCsv(await db.transactions.orderBy('date').toArray(), 'financia-tout.csv')
}
</script>

<template>
  <h1>Réglages</h1>

  <section class="card">
    <h2>Budgets mensuels par catégorie</h2>
    <p class="hint">Fixe un plafond de dépenses : le tableau de bord t'alerte quand tu t'en approches.</p>
    <div v-for="c in EXPENSE_CATEGORIES" :key="c" class="settings-row">
      <span>{{ c }}</span>
      <input
        class="budget-input"
        type="number"
        min="0"
        step="1"
        placeholder="—"
        :value="budgets.budgets[c] ?? ''"
        @change="onBudgetChange(c, $event)"
      />
    </div>
  </section>

  <section class="card">
    <h2>Transactions récurrentes</h2>
    <p class="hint">Loyer, abonnements, bourse… créées automatiquement chaque mois.</p>

    <ul v-if="recurrings.recurrings.length" class="rec-list">
      <li v-for="r in recurrings.recurrings" :key="r.id" class="settings-row">
        <div class="tx-info">
          <span class="tx-category">{{ r.category }}<template v-if="r.note"> — {{ r.note }}</template></span>
          <span class="tx-note">le {{ r.dayOfMonth }} de chaque mois</span>
        </div>
        <strong :class="r.type === 'income' ? 'income' : 'expense'">
          {{ r.type === 'income' ? '+' : '−' }}{{ formatAmount(r.amount) }}
        </strong>
        <button type="button" class="tx-delete" aria-label="Supprimer" @click="removeRecurring(r.id)">✕</button>
      </li>
    </ul>

    <form class="form rec-form" @submit.prevent="addRecurring">
      <div class="type-toggle">
        <button type="button" :class="{ active: rType === 'expense' }" @click="setRType('expense')">Dépense</button>
        <button type="button" :class="{ active: rType === 'income' }" @click="setRType('income')">Revenu</button>
      </div>
      <label>
        Montant (€)
        <input v-model.number="rAmount" type="number" step="0.01" min="0.01" required placeholder="0,00" />
      </label>
      <label>
        Catégorie
        <select v-model="rCategory" required>
          <option value="" disabled>Choisir une catégorie…</option>
          <option v-for="c in rCategories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <label>
        Jour du mois
        <input v-model.number="rDay" type="number" min="1" max="31" required />
      </label>
      <label>
        Note (optionnel)
        <input v-model="rNote" type="text" maxlength="100" placeholder="Ex. : loyer" />
      </label>
      <button type="submit" class="submit-btn">Ajouter la récurrence</button>
    </form>
  </section>

  <section class="card">
    <h2>Exporter en CSV</h2>
    <div class="export-btns">
      <button type="button" class="btn-secondary" @click="exportMonth">
        {{ formatMonth(transactions.month) }}
      </button>
      <button type="button" class="btn-secondary" @click="exportAll">Tout l'historique</button>
    </div>
  </section>
</template>

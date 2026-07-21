<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Pencil, Trash2, Download } from 'lucide-vue-next'
import { db, type Category } from '../db'
import { useBudgetsStore } from '../stores/budgets'
import { useCategoriesStore } from '../stores/categories'
import { useRecurringsStore } from '../stores/recurrings'
import { useTransactionsStore } from '../stores/transactions'
import { formatAmount, formatMonth } from '../lib/format'
import { downloadCsv } from '../lib/csv'

const budgets = useBudgetsStore()
const cats = useCategoriesStore()
const recurrings = useRecurringsStore()
const transactions = useTransactionsStore()

onMounted(() => {
  budgets.load()
  cats.load()
  recurrings.load()
  transactions.load()
})

// --- Catégories personnalisées ---
const cType = ref<'expense' | 'income'>('expense')
const cName = ref('')
const cColor = ref('#804a8a')

const shownCategories = computed(() =>
  cType.value === 'expense' ? cats.expenseCategories : cats.incomeCategories
)

function isDuplicate(name: string) {
  return shownCategories.value.some(
    (c) => c.name.localeCompare(name, 'fr', { sensitivity: 'base' }) === 0
  )
}

async function addCategory() {
  const name = cName.value.trim()
  if (!name) return
  if (isDuplicate(name)) {
    alert('Cette catégorie existe déjà.')
    return
  }
  await cats.add(name, cType.value, cColor.value)
  cName.value = ''
}

async function renameCategory(c: Category) {
  const name = prompt('Nouveau nom :', c.name)?.trim()
  if (!name || name === c.name) return
  if (isDuplicate(name)) {
    alert('Cette catégorie existe déjà.')
    return
  }
  await cats.rename(c.id, name)
  await Promise.all([transactions.load(), budgets.load(), recurrings.load()])
}

async function removeCategory(c: Category) {
  if (confirm(`Supprimer « ${c.name} » ? Ses transactions seront reclassées dans « Autre ».`)) {
    await cats.remove(c.id)
    await Promise.all([transactions.load(), budgets.load(), recurrings.load()])
  }
}

// --- Budgets ---
function onBudgetChange(category: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  budgets.set(category, Number.isFinite(value) && value > 0 ? value : null)
}

// --- Formulaire de nouvelle récurrence ---
const rType = ref<'expense' | 'income'>('expense')
const rAmount = ref<number | null>(null)
const rCategory = ref('')
const rDay = ref(1)
const rNote = ref('')

const rCategories = computed(() =>
  rType.value === 'expense' ? cats.expenseCategories : cats.incomeCategories
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

// --- Export CSV ---
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
    <h2>Catégories</h2>
    <p class="hint">
      Personnalise tes catégories : nom et couleur. « Autre » sert de catégorie de repli et ne peut
      pas être modifiée.
    </p>

    <div class="type-toggle">
      <button type="button" :class="{ active: cType === 'expense' }" @click="cType = 'expense'">
        Dépenses
      </button>
      <button type="button" :class="{ active: cType === 'income' }" @click="cType = 'income'">
        Revenus
      </button>
    </div>

    <ul class="rec-list cat-manage-list">
      <li v-for="c in shownCategories" :key="c.id" class="settings-row">
        <span class="dot" :style="{ background: c.color }"></span>
        <span class="cat-name">{{ c.name }}</span>
        <template v-if="c.name !== 'Autre'">
          <button type="button" class="icon-btn" aria-label="Renommer" @click="renameCategory(c)"><Pencil :size="16" /></button>
          <button type="button" class="icon-btn danger" aria-label="Supprimer" @click="removeCategory(c)"><Trash2 :size="16" /></button>
        </template>
      </li>
    </ul>

    <form class="form rec-form" @submit.prevent="addCategory">
      <div class="cat-add-row">
        <input
          v-model="cName"
          type="text"
          maxlength="30"
          required
          :placeholder="cType === 'expense' ? 'Nouvelle catégorie de dépense…' : 'Nouvelle catégorie de revenu…'"
        />
        <input v-model="cColor" type="color" class="color-input" aria-label="Couleur de la catégorie" />
      </div>
      <button type="submit" class="submit-btn">Ajouter la catégorie</button>
    </form>
  </section>

  <section class="card">
    <h2>Budgets mensuels par catégorie</h2>
    <p class="hint">Fixe un plafond de dépenses : le tableau de bord t'alerte quand tu t'en approches.</p>
    <div v-for="c in cats.expenseCategories" :key="c.id" class="settings-row">
      <span>{{ c.name }}</span>
      <input
        class="budget-input"
        type="number"
        min="0"
        step="1"
        placeholder="—"
        :value="budgets.budgets[c.name] ?? ''"
        @change="onBudgetChange(c.name, $event)"
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
        <strong class="tx-amount" :class="r.type === 'income' ? 'income' : 'expense'">
          {{ r.type === 'income' ? '+' : '−' }}{{ formatAmount(r.amount) }}
        </strong>
        <button type="button" class="icon-btn danger" aria-label="Supprimer" @click="removeRecurring(r.id)"><Trash2 :size="16" /></button>
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
          <option v-for="c in rCategories" :key="c.id" :value="c.name">{{ c.name }}</option>
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
        <Download :size="16" /> {{ formatMonth(transactions.month) }}
      </button>
      <button type="button" class="btn-secondary" @click="exportAll">
        <Download :size="16" /> Tout l'historique
      </button>
    </div>
  </section>
</template>

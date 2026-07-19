<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db'
import { useTransactionsStore } from '../stores/transactions'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../categories'

const route = useRoute()
const router = useRouter()
const store = useTransactionsStore()

const editId = route.params.id ? Number(route.params.id) : null

const type = ref<'expense' | 'income'>('expense')
const amount = ref<number | null>(null)
const category = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')
const recurringId = ref<number | undefined>(undefined)

const categories = computed(() =>
  type.value === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
)

onMounted(async () => {
  if (editId === null) return
  const t = await db.transactions.get(editId)
  if (!t) {
    router.replace('/')
    return
  }
  type.value = t.type
  amount.value = t.amount
  category.value = t.category
  date.value = t.date
  note.value = t.note ?? ''
  recurringId.value = t.recurringId
})

function setType(t: 'expense' | 'income') {
  type.value = t
  category.value = ''
}

async function submit() {
  if (!amount.value || amount.value <= 0 || !category.value || !date.value) return
  const data = {
    type: type.value,
    amount: amount.value,
    category: category.value,
    date: date.value,
    note: note.value.trim() || undefined,
    recurringId: recurringId.value
  }
  if (editId !== null) {
    await store.update({ id: editId, ...data })
    router.push('/transactions')
  } else {
    await store.add(data)
    router.push('/')
  }
}
</script>

<template>
  <h1>{{ editId !== null ? 'Modifier la transaction' : 'Nouvelle transaction' }}</h1>

  <form class="card form" @submit.prevent="submit">
    <div class="type-toggle">
      <button
        type="button"
        :class="{ active: type === 'expense' }"
        @click="setType('expense')"
      >
        Dépense
      </button>
      <button
        type="button"
        :class="{ active: type === 'income' }"
        @click="setType('income')"
      >
        Revenu
      </button>
    </div>

    <label>
      Montant (€)
      <input v-model.number="amount" type="number" step="0.01" min="0.01" required placeholder="0,00" />
    </label>

    <label>
      Catégorie
      <select v-model="category" required>
        <option value="" disabled>Choisir une catégorie…</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </label>

    <label>
      Date
      <input v-model="date" type="date" required />
    </label>

    <label>
      Note (optionnel)
      <input v-model="note" type="text" maxlength="100" placeholder="Ex. : courses de la semaine" />
    </label>

    <button type="submit" class="submit-btn">
      {{ editId !== null ? 'Enregistrer' : 'Ajouter' }}
    </button>
  </form>
</template>

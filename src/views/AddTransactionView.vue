<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionsStore } from '../stores/transactions'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../categories'

const router = useRouter()
const store = useTransactionsStore()

const type = ref<'expense' | 'income'>('expense')
const amount = ref<number | null>(null)
const category = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')

const categories = computed(() =>
  type.value === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
)

function setType(t: 'expense' | 'income') {
  type.value = t
  category.value = ''
}

async function submit() {
  if (!amount.value || amount.value <= 0 || !category.value || !date.value) return
  await store.add({
    type: type.value,
    amount: amount.value,
    category: category.value,
    date: date.value,
    note: note.value.trim() || undefined
  })
  router.push('/')
}
</script>

<template>
  <h1>Nouvelle transaction</h1>

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

    <button type="submit" class="submit-btn">Ajouter</button>
  </form>
</template>

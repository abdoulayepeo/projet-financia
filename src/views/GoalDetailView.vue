<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Trash2 } from 'lucide-vue-next'
import { useGoalsStore } from '../stores/goals'
import { useDialog } from '../composables/dialog'
import { formatAmount } from '../lib/format'

const route = useRoute()
const router = useRouter()
const goals = useGoalsStore()
const dialog = useDialog()

const id = Number(route.params.id)
const amount = ref<number | null>(null)
const ready = ref(false)

onMounted(async () => {
  await goals.load()
  if (!goals.goals.some((g) => g.id === id)) {
    router.replace('/objectifs')
    return
  }
  ready.value = true
})

const goal = computed(() => goals.goals.find((g) => g.id === id))
const saved = computed(() => goals.savedFor(id))
const ratio = computed(() => (goal.value && goal.value.target > 0 ? saved.value / goal.value.target : 0))
const remaining = computed(() => Math.max((goal.value?.target ?? 0) - saved.value, 0))
const reached = computed(() => !!goal.value && saved.value >= goal.value.target)
const monthly = computed(() => (goal.value ? goals.suggestedMonthly(goal.value) : null))
const contributions = computed(() => goals.contributionsFor(id))

const deadlineLabel = computed(() => {
  if (!goal.value?.deadline) return null
  return new Date(goal.value.deadline + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

async function putAside() {
  if (!amount.value || amount.value <= 0) return
  await goals.contribute(id, amount.value)
  amount.value = null
}

async function withdraw() {
  if (!amount.value || amount.value <= 0) return
  const take = Math.min(amount.value, saved.value)
  if (take <= 0) return
  await goals.contribute(id, -take)
  amount.value = null
}

async function removeContribution(cid: number) {
  await goals.removeContribution(cid)
}

async function deleteGoal() {
  const ok = await dialog.confirm({
    title: `Supprimer « ${goal.value?.name} » ?`,
    message: 'La cagnotte et son historique seront supprimés. L’argent déjà dépensé n’est pas restitué automatiquement.',
    confirmLabel: 'Supprimer',
    danger: true
  })
  if (ok) {
    await goals.removeGoal(id)
    router.replace('/objectifs')
  }
}
</script>

<template>
  <template v-if="ready && goal">
    <button type="button" class="back-link" @click="router.push('/objectifs')">
      <ChevronLeft :size="18" /> Objectifs
    </button>

    <section class="card goal-detail">
      <h1 class="goal-title">
        <span class="dot" :style="{ background: goal.color }"></span>{{ goal.name }}
      </h1>

      <div class="goal-figures">
        <strong :style="{ color: goal.color }">{{ formatAmount(saved) }}</strong>
        <span class="goal-target">sur {{ formatAmount(goal.target) }}</span>
      </div>

      <div class="budget-bar goal-bar-lg">
        <div
          class="budget-fill"
          :style="{ width: Math.min(ratio, 1) * 100 + '%', background: goal.color }"
        ></div>
      </div>

      <p v-if="reached" class="goal-badge big">Objectif atteint 🎉</p>
      <p v-else class="goal-remaining">Encore {{ formatAmount(remaining) }} à épargner</p>

      <div v-if="goal.deadline" class="goal-deadline">
        <span>📅 Échéance : {{ deadlineLabel }}</span>
        <span v-if="!reached && monthly !== null" class="goal-hint">
          💡 <strong>{{ formatAmount(monthly) }}/mois</strong> pour y arriver
        </span>
      </div>
    </section>

    <section class="card form">
      <h2>Mettre de côté</h2>
      <p class="hint">L’argent est prélevé de ton disponible du mois. Tu peux aussi en retirer.</p>
      <label>
        Montant (€)
        <input v-model.number="amount" type="number" step="0.01" min="0.01" placeholder="0,00" />
      </label>
      <div class="goal-actions">
        <button type="button" class="btn-secondary" :disabled="saved <= 0" @click="withdraw">Retirer</button>
        <button type="button" class="submit-btn" @click="putAside">Mettre de côté</button>
      </div>
    </section>

    <section v-if="contributions.length" class="card">
      <h2>Historique</h2>
      <ul class="tx-list">
        <li v-for="c in contributions" :key="c.id" class="settings-row">
          <div class="tx-info">
            <span class="tx-category">{{ c.amount >= 0 ? 'Mis de côté' : 'Retiré' }}</span>
            <span class="tx-note">{{ new Date(c.date + 'T00:00:00').toLocaleDateString('fr-FR') }}</span>
          </div>
          <strong class="tx-amount" :class="c.amount >= 0 ? 'income' : 'expense'">
            {{ c.amount >= 0 ? '+' : '−' }}{{ formatAmount(Math.abs(c.amount)) }}
          </strong>
          <button type="button" class="icon-btn danger" aria-label="Supprimer" @click="removeContribution(c.id)">
            <Trash2 :size="16" />
          </button>
        </li>
      </ul>
    </section>

    <button type="button" class="delete-goal" @click="deleteGoal">Supprimer cet objectif</button>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Trash2, Pencil } from 'lucide-vue-next'
import { useGoalsStore } from '../stores/goals'
import { useDialog } from '../composables/dialog'
import { useCurrency } from '../composables/currency'
import { toast } from '../composables/toast'
import { formatAmount } from '../lib/format'
import ConfettiBurst from '../components/ConfettiBurst.vue'

const route = useRoute()
const router = useRouter()
const goals = useGoalsStore()
const dialog = useDialog()
const { symbol } = useCurrency()

const id = Number(route.params.id)
const amount = ref<number | null>(null)
const ready = ref(false)
const showConfetti = ref(false)

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
  const room = remaining.value
  if (room <= 0) return
  const wasReached = reached.value
  const overflow = amount.value > room
  // On plafonne au montant cible : impossible de dépasser l'objectif.
  const add = Math.min(amount.value, room)
  await goals.contribute(id, add)
  amount.value = null

  const justReached = !wasReached && reached.value
  if (justReached) showConfetti.value = true

  if (overflow) {
    await dialog.alert({
      title: 'Objectif atteint 🎉',
      message: `Seuls ${formatAmount(add)} ont été ajoutés pour atteindre exactement ton objectif.`
    })
  } else if (justReached) {
    toast(`🎉 Objectif « ${goal.value?.name} » atteint !`)
  } else {
    toast('Mis de côté')
  }
}

async function withdraw() {
  if (!amount.value || amount.value <= 0) return
  const take = Math.min(amount.value, saved.value)
  if (take <= 0) return
  await goals.contribute(id, -take)
  toast('Retiré de la cagnotte')
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

// --- Édition de l'objectif ---
const editing = ref(false)
const editName = ref('')
const editTarget = ref<number | null>(null)
const editDeadline = ref('')
const editColor = ref('#f59e51')

function startEdit() {
  if (!goal.value) return
  editName.value = goal.value.name
  editTarget.value = goal.value.target
  editDeadline.value = goal.value.deadline ?? ''
  editColor.value = goal.value.color
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveEdit() {
  if (!goal.value || !editName.value.trim() || !editTarget.value || editTarget.value <= 0) return
  await goals.updateGoal({
    ...goal.value,
    name: editName.value.trim(),
    target: editTarget.value,
    deadline: editDeadline.value || undefined,
    color: editColor.value
  })
  editing.value = false
  toast('Objectif mis à jour')
}
</script>

<template>
  <template v-if="ready && goal">
    <button type="button" class="back-link" @click="router.push('/objectifs')">
      <ChevronLeft :size="18" /> Objectifs
    </button>

    <section class="card goal-detail">
      <div class="goal-detail-head">
        <h1 class="goal-title">
          <span class="dot" :style="{ background: goal.color }"></span>{{ goal.name }}
        </h1>
        <button
          v-if="!editing"
          type="button"
          class="icon-btn"
          aria-label="Modifier l'objectif"
          @click="startEdit"
        >
          <Pencil :size="18" />
        </button>
      </div>

      <template v-if="!editing">
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
      </template>

      <form v-else class="form goal-edit-form" @submit.prevent="saveEdit">
        <label>
          Nom
          <input v-model="editName" type="text" maxlength="40" required />
        </label>
        <label>
          Montant à atteindre ({{ symbol }})
          <input v-model.number="editTarget" type="number" step="0.01" min="1" required />
        </label>
        <div class="cat-add-row">
          <label style="flex: 1">
            Date limite (optionnel)
            <input v-model="editDeadline" type="date" />
          </label>
          <label>
            Couleur
            <input v-model="editColor" type="color" class="color-input" aria-label="Couleur de l'objectif" />
          </label>
        </div>
        <div class="goal-actions">
          <button type="button" class="btn-secondary" @click="cancelEdit">Annuler</button>
          <button type="submit" class="submit-btn">Enregistrer</button>
        </div>
      </form>
    </section>

    <section class="card form">
      <h2>Mettre de côté</h2>
      <p class="hint">L’argent est prélevé de ton disponible du mois. Tu peux aussi en retirer.</p>
      <label>
        Montant ({{ symbol }})
        <input v-model.number="amount" type="number" step="0.01" min="0.01" placeholder="0,00" />
      </label>
      <div class="goal-actions">
        <button type="button" class="btn-secondary" :disabled="saved <= 0" @click="withdraw">Retirer</button>
        <button type="button" class="submit-btn" :disabled="reached" @click="putAside">
          {{ reached ? 'Objectif atteint' : 'Mettre de côté' }}
        </button>
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

    <ConfettiBurst v-if="showConfetti" @done="showConfetti = false" />
  </template>
</template>

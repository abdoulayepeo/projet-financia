<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Target } from 'lucide-vue-next'
import { useGoalsStore } from '../stores/goals'
import { useCurrency } from '../composables/currency'
import { toast } from '../composables/toast'
import { formatAmount } from '../lib/format'
import Skeleton from '../components/Skeleton.vue'

const router = useRouter()
const goals = useGoalsStore()
const { symbol } = useCurrency()

onMounted(() => goals.load())

const name = ref('')
const target = ref<number | null>(null)
const color = ref('#f59e51')
const deadline = ref('')

const rows = computed(() =>
  goals.goals.map((g) => {
    const saved = goals.savedFor(g.id)
    return {
      goal: g,
      saved,
      ratio: g.target > 0 ? saved / g.target : 0,
      reached: saved >= g.target,
      monthly: goals.suggestedMonthly(g)
    }
  })
)

async function addGoal() {
  if (!name.value.trim() || !target.value || target.value <= 0) return
  await goals.addGoal({
    name: name.value.trim(),
    target: target.value,
    color: color.value,
    deadline: deadline.value || undefined
  })
  toast('Objectif créé')
  name.value = ''
  target.value = null
  color.value = '#f59e51'
  deadline.value = ''
}
</script>

<template>
  <h1>Objectifs d'épargne</h1>

  <!-- Squelettes -->
  <template v-if="!goals.hasLoaded">
    <div v-for="i in 2" :key="i" class="card">
      <Skeleton width="60%" height="1.1rem" />
      <div style="margin-top: 0.9rem"><Skeleton block height="0.9rem" /></div>
    </div>
  </template>

  <!-- État vide illustré -->
  <template v-else-if="!rows.length">
    <div class="empty-state">
      <div class="empty-illustration"><Target :size="34" /></div>
      <h3>Aucun objectif pour l'instant</h3>
      <p>Fixe-toi un but concret (téléphone, voyage, permis…) et suis ta progression mois après mois.</p>
    </div>
  </template>

  <!-- Liste des objectifs -->
  <section
    v-for="r in rows"
    :key="r.goal.id"
    class="card goal-card"
    @click="router.push(`/objectifs/${r.goal.id}`)"
  >
    <div class="goal-head">
      <span class="goal-name">
        <span class="dot" :style="{ background: r.goal.color }"></span>
        {{ r.goal.name }}
      </span>
      <span v-if="r.reached" class="goal-badge">Atteint 🎉</span>
      <span v-else class="goal-amounts">{{ formatAmount(r.saved) }} / {{ formatAmount(r.goal.target) }}</span>
    </div>
    <div class="budget-bar">
      <div
        class="budget-fill"
        :style="{ width: Math.min(r.ratio, 1) * 100 + '%', background: r.reached ? undefined : r.goal.color }"
        :class="{ over: r.reached }"
      ></div>
    </div>
    <p v-if="!r.reached && r.monthly !== null" class="goal-hint">
      💡 Mets <strong>{{ formatAmount(r.monthly) }}/mois</strong> pour tenir la date limite
    </p>
  </section>

  <!-- Formulaire de création (toujours visible) -->
  <form v-if="goals.hasLoaded" class="card form" @submit.prevent="addGoal">
    <h2><Target :size="18" style="vertical-align: -3px" /> Nouvel objectif</h2>
    <label>
      Nom
      <input v-model="name" type="text" maxlength="40" required placeholder="Ex. : Nouveau téléphone" />
    </label>
    <label>
      Montant à atteindre ({{ symbol }})
      <input v-model.number="target" type="number" step="0.01" min="1" required placeholder="0,00" />
    </label>
    <div class="cat-add-row">
      <label style="flex: 1">
        Date limite (optionnel)
        <input v-model="deadline" type="date" />
      </label>
      <label>
        Couleur
        <input v-model="color" type="color" class="color-input" aria-label="Couleur de l'objectif" />
      </label>
    </div>
    <button type="submit" class="submit-btn">Créer l'objectif</button>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Lock,
  Rocket,
  Target,
  Wallet
} from 'lucide-vue-next'
import LogoMark from './LogoMark.vue'
import { CURRENCIES, currency } from '../composables/currency'
import { markOnboarded } from '../composables/onboarding'
import { useCategoriesStore } from '../stores/categories'
import { useTransactionsStore } from '../stores/transactions'
import { formatAmount } from '../lib/format'

const router = useRouter()
const cats = useCategoriesStore()
const transactions = useTransactionsStore()

const LAST_STEP = 3
const step = ref(0)
const amount = ref<number | null>(null)
const category = ref('Salaire')
const busy = ref(false)

const panel = ref<HTMLElement | null>(null)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const currencySymbol = computed(() => CURRENCIES.find((c) => c.code === currency.value)!.symbol)

onMounted(async () => {
  await cats.load()
  category.value = cats.incomeCategories[0]?.name ?? 'Salaire'
  animate()
})

watch(step, () => nextTick(animate))

function animate() {
  if (reduceMotion || !panel.value) return
  gsap.from(panel.value, {
    opacity: 0,
    y: 20,
    duration: 0.34,
    ease: 'power2.out',
    overwrite: true,
    clearProps: 'opacity,transform'
  })
}

function next() {
  if (step.value < LAST_STEP) step.value++
}

function back() {
  if (step.value > 0) step.value--
}

/**
 * Termine le parcours. Le premier revenu n'est enregistré qu'ici : on peut
 * revenir en arrière autant qu'on veut sans créer de doublon.
 */
async function finish(then?: 'goals') {
  if (busy.value) return
  busy.value = true
  if (amount.value && amount.value > 0) {
    await transactions.add({
      type: 'income',
      amount: amount.value,
      category: category.value,
      date: new Date().toISOString().slice(0, 10)
    })
  }
  busy.value = false
  markOnboarded()
  if (then === 'goals') router.push('/objectifs')
}
</script>

<template>
  <div class="onboarding" role="dialog" aria-modal="true" aria-label="Bienvenue sur Financia">
    <header class="onb-bar">
      <button
        v-if="step > 0"
        type="button"
        class="onb-back"
        aria-label="Étape précédente"
        @click="back"
      >
        <ChevronLeft :size="20" />
      </button>
      <span v-else class="onb-back-spacer"></span>

      <div class="onb-dots" aria-hidden="true">
        <span v-for="i in LAST_STEP + 1" :key="i" class="onb-dot" :class="{ on: i - 1 <= step }"></span>
      </div>

      <button v-if="step < LAST_STEP" type="button" class="onb-skip" @click="finish()">Passer</button>
      <span v-else class="onb-back-spacer"></span>
    </header>

    <div :key="step" ref="panel" class="onb-panel">
      <!-- 1 · Bienvenue -->
      <template v-if="step === 0">
        <div class="onb-logo"><LogoMark :size="76" variant="tile" /></div>
        <h1 class="onb-title">Bienvenue sur Financia</h1>
        <p class="onb-lead">
          Ton argent, enfin clair. Trois minutes par semaine suffisent pour savoir
          où tu en es.
        </p>
        <ul class="onb-features">
          <li>
            <span class="onb-feature-ic"><Wallet :size="18" /></span>
            <div>
              <strong>Suis tes dépenses</strong>
              <span>Revenus, dépenses et budgets, mois par mois.</span>
            </div>
          </li>
          <li>
            <span class="onb-feature-ic"><Target :size="18" /></span>
            <div>
              <strong>Épargne pour tes projets</strong>
              <span>Voyage, téléphone, permis… avec un montant mensuel suggéré.</span>
            </div>
          </li>
          <li>
            <span class="onb-feature-ic"><Lock :size="18" /></span>
            <div>
              <strong>100 % sur ton téléphone</strong>
              <span>Aucun compte, aucun serveur : tes données ne sortent jamais.</span>
            </div>
          </li>
        </ul>
      </template>

      <!-- 2 · Devise -->
      <template v-else-if="step === 1">
        <h1 class="onb-title">Ta devise</h1>
        <p class="onb-lead">Elle sert à afficher tes montants. Modifiable à tout moment dans les réglages.</p>
        <div class="onb-choices">
          <button
            v-for="c in CURRENCIES"
            :key="c.code"
            type="button"
            class="onb-choice"
            :class="{ active: currency === c.code }"
            @click="currency = c.code"
          >
            <span class="onb-choice-sym">{{ c.symbol }}</span>
            <span class="onb-choice-label">{{ c.label }}</span>
            <Check v-if="currency === c.code" :size="18" class="onb-choice-check" />
          </button>
        </div>
      </template>

      <!-- 3 · Premier revenu -->
      <template v-else-if="step === 2">
        <h1 class="onb-title">Ton premier revenu</h1>
        <p class="onb-lead">
          Salaire, bourse, argent de poche… C'est la base de ton budget du mois.
          Tu peux aussi passer cette étape.
        </p>
        <div class="form onb-form">
          <label>
            Montant ({{ currencySymbol }})
            <input v-model.number="amount" type="number" step="0.01" min="0" placeholder="0,00" inputmode="decimal" />
          </label>
          <label>
            Catégorie
            <select v-model="category">
              <option v-for="c in cats.incomeCategories" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </label>
        </div>
      </template>

      <!-- 4 · C'est parti -->
      <template v-else>
        <div class="onb-logo"><Rocket :size="40" /></div>
        <h1 class="onb-title">Tout est prêt</h1>
        <p class="onb-lead">
          <template v-if="amount && amount > 0">
            {{ formatAmount(amount) }} de {{ category.toLowerCase() }} pour démarrer.
            Ajoute tes dépenses avec le bouton ＋ et regarde ton disponible évoluer.
          </template>
          <template v-else>
            Ajoute ta première transaction avec le bouton ＋ en bas de l'écran, et
            ton tableau de bord se remplit tout seul.
          </template>
        </p>
        <button type="button" class="onb-secondary" @click="finish('goals')">
          <Target :size="16" /> Créer un objectif d'épargne
        </button>
      </template>
    </div>

    <footer class="onb-actions">
      <button v-if="step < LAST_STEP" type="button" class="submit-btn onb-cta" @click="next">
        {{ step === 2 && !amount ? 'Plus tard' : 'Continuer' }} <ArrowRight :size="18" />
      </button>
      <button v-else type="button" class="submit-btn onb-cta" :disabled="busy" @click="finish()">
        Commencer <ArrowRight :size="18" />
      </button>
    </footer>
  </div>
</template>

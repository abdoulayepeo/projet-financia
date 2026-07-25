<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import gsap from 'gsap'
import {
  Sun,
  Moon,
  PieChart,
  BarChart3,
  Plus,
  ReceiptText,
  Target,
  Settings
} from 'lucide-vue-next'
import LogoMark from './components/LogoMark.vue'
import AppDialog from './components/AppDialog.vue'
import AppToast from './components/AppToast.vue'
import SplashScreen from './components/SplashScreen.vue'
import { useTheme } from './composables/useTheme'
import { useCategoriesStore } from './stores/categories'
import { useRecurringsStore } from './stores/recurrings'
import { useTransactionsStore } from './stores/transactions'

const { theme, toggle } = useTheme()
const route = useRoute()
const router = useRouter()
const categories = useCategoriesStore()
const recurrings = useRecurringsStore()
const transactions = useTransactionsStore()

const showSplash = ref(true)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Anime l'entrée des éléments de la page à chaque navigation.
function animateContent() {
  if (reduceMotion) return
  gsap.from('.content > *', {
    opacity: 0,
    y: 14,
    duration: 0.35,
    stagger: 0.05,
    ease: 'power2.out'
  })
}

watch(
  () => route.path,
  () => nextTick(animateContent)
)

onMounted(async () => {
  await categories.load()
  await recurrings.applyDue()
  await transactions.load()
  nextTick(animateContent)
})
</script>

<template>
  <div class="app">
    <SplashScreen v-if="showSplash" @finished="showSplash = false" />

    <header class="app-bar">
      <div class="brand">
        <span class="brand-icon"><LogoMark :size="22" variant="tile" /></span>
        Financia
      </div>
      <div class="app-bar-actions">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'"
          @click="toggle"
        >
          <Sun v-if="theme === 'dark'" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <button
          class="theme-toggle"
          type="button"
          aria-label="Ouvrir les réglages"
          :class="{ 'is-active': route.path === '/reglages' }"
          @click="router.push('/reglages')"
        >
          <Settings :size="18" />
        </button>
      </div>
    </header>

    <main class="content">
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink to="/" class="nav-item">
        <PieChart :size="20" />
        <span>Accueil</span>
      </RouterLink>
      <RouterLink to="/stats" class="nav-item">
        <BarChart3 :size="20" />
        <span>Stats</span>
      </RouterLink>
      <RouterLink to="/ajouter" class="nav-item nav-add" aria-label="Ajouter une transaction">
        <span class="nav-add-btn"><Plus :size="26" /></span>
      </RouterLink>
      <RouterLink to="/transactions" class="nav-item">
        <ReceiptText :size="20" />
        <span>Historique</span>
      </RouterLink>
      <RouterLink to="/objectifs" class="nav-item">
        <Target :size="20" />
        <span>Objectifs</span>
      </RouterLink>
    </nav>

    <AppDialog />
    <AppToast />
  </div>
</template>

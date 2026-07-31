import { ref } from 'vue'
import { db } from '../db'

const STORAGE_KEY = 'financia-onboarded'

/** Pilote l'affichage de l'accueil guidé (premier lancement uniquement). */
export const showOnboarding = ref(false)

export function markOnboarded() {
  localStorage.setItem(STORAGE_KEY, '1')
  showOnboarding.value = false
}

/**
 * Décide si l'accueil guidé doit s'afficher. Deux garde-fous : le drapeau
 * local, et l'état réel de la base — quelqu'un qui a déjà des données (mise à
 * jour de l'app, stockage local nettoyé) ne doit jamais le revoir.
 */
export async function checkOnboarding() {
  if (localStorage.getItem(STORAGE_KEY)) return
  const [txCount, goalCount] = await Promise.all([db.transactions.count(), db.goals.count()])
  if (txCount === 0 && goalCount === 0) showOnboarding.value = true
  else markOnboarded()
}

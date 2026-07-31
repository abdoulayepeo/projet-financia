import { ref } from 'vue'

/**
 * Identifie la ligne actuellement ouverte (glissée vers la gauche). Partagé
 * par toutes les instances de `SwipeRow` : ouvrir une ligne referme l'autre.
 */
export const openSwipeRow = ref<symbol | null>(null)

export function closeAllSwipeRows() {
  openSwipeRow.value = null
}

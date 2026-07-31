import { ref } from 'vue'

export interface ToastAction {
  label: string
  run: () => void
}

export const toastState = ref<{ id: number; text: string; action?: ToastAction } | null>(null)

let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Affiche un petit message de confirmation + légère vibration (mobile).
 * Une action optionnelle (« Annuler ») ajoute un bouton et laisse plus de
 * temps pour réagir.
 */
export function toast(text: string, action?: ToastAction) {
  toastState.value = { id: Date.now(), text, action }
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
  clearTimeout(timer)
  timer = setTimeout(() => (toastState.value = null), action ? 5000 : 2200)
}

export function dismissToast() {
  clearTimeout(timer)
  toastState.value = null
}

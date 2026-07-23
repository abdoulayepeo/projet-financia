import { ref } from 'vue'

export const toastState = ref<{ id: number; text: string } | null>(null)

let timer: ReturnType<typeof setTimeout> | undefined

/** Affiche un petit message de confirmation + légère vibration (mobile). */
export function toast(text: string) {
  toastState.value = { id: Date.now(), text }
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
  clearTimeout(timer)
  timer = setTimeout(() => (toastState.value = null), 2200)
}

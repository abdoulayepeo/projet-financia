<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { openSwipeRow } from '../composables/swipe'

/**
 * Ligne de liste que l'on fait glisser vers la gauche (au doigt) pour révéler
 * une action « Supprimer ». Le bouton corbeille reste présent dans la ligne :
 * le geste est un raccourci, pas le seul chemin (souris, clavier et lecteur
 * d'écran continuent de fonctionner).
 */
const emit = defineEmits<{ delete: [] }>()

/** Largeur du panneau révélé, en px. */
const REVEAL = 88
/** Résistance : on peut tirer un peu au-delà du panneau. */
const OVERPULL = 18

const me = Symbol('swipe-row')
const offset = ref(0)
const dragging = ref(false)
const isOpen = computed(() => openSwipeRow.value === me)

let startX = 0
let startY = 0
let base = 0
let axis: 'x' | 'y' | null = null
let justSwiped = false

// Si une autre ligne s'ouvre, celle-ci se remet en place.
watch(isOpen, (open) => {
  offset.value = open ? -REVEAL : 0
})

function close() {
  if (openSwipeRow.value === me) openSwipeRow.value = null
  offset.value = 0
}

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  startX = t.clientX
  startY = t.clientY
  base = isOpen.value ? -REVEAL : 0
  axis = null
  dragging.value = false
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  const dx = t.clientX - startX
  const dy = t.clientY - startY

  // Tant que la direction n'est pas tranchée, on laisse le scroll vertical faire.
  if (!axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (axis === 'x') dragging.value = true
  }
  if (axis !== 'x') return

  offset.value = Math.max(Math.min(base + dx, 0), -(REVEAL + OVERPULL))
}

function onTouchEnd() {
  if (axis === 'x') {
    const shouldOpen = offset.value < -REVEAL / 2
    if (shouldOpen) openSwipeRow.value = me
    else if (isOpen.value) openSwipeRow.value = null
    offset.value = shouldOpen ? -REVEAL : 0
    // Empêche le clic synthétique qui suit le geste d'activer la ligne.
    justSwiped = true
    setTimeout(() => (justSwiped = false), 350)
  }
  dragging.value = false
  axis = null
}

/**
 * Quand la ligne est ouverte (ou vient d'être glissée), un appui la referme
 * au lieu de déclencher l'action de la ligne.
 */
function onClickCapture(e: MouseEvent) {
  if (!isOpen.value && !justSwiped) return
  e.stopPropagation()
  e.preventDefault()
  close()
}

function onDelete() {
  close()
  emit('delete')
}

onBeforeUnmount(close)
</script>

<template>
  <li class="swipe-row" :class="{ 'is-open': isOpen }">
    <button
      type="button"
      class="swipe-action"
      tabindex="-1"
      aria-hidden="true"
      @click="onDelete"
    >
      <Trash2 :size="18" />
      <span>Supprimer</span>
    </button>

    <div
      class="swipe-content"
      :class="{ dragging }"
      :style="{ transform: `translateX(${offset}px)` }"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @click.capture="onClickCapture"
    >
      <slot />
    </div>
  </li>
</template>

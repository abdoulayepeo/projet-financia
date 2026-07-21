<script setup lang="ts">
import { useId } from 'vue'

// Symbole « Momentum » : deux chevrons qui montent.
// - tile  : posé sur la pastille dégradée (chevron or + chevron blanc)
// - color : sur fond clair/neutre (chevron or + chevron violet)
// - mono  : monochrome, suit la couleur du texte (currentColor)
withDefaults(
  defineProps<{ size?: number | string; variant?: 'tile' | 'color' | 'mono' }>(),
  { size: 24, variant: 'tile' }
)

const uid = useId()
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    role="img"
    aria-label="Logo Financia"
  >
    <defs v-if="variant !== 'mono'">
      <linearGradient :id="`gold-${uid}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f8d299" />
        <stop offset="1" stop-color="#f59e51" />
      </linearGradient>
      <linearGradient :id="`purple-${uid}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#804a8a" />
        <stop offset="1" stop-color="#3a0353" />
      </linearGradient>
    </defs>

    <!-- Chevron du bas -->
    <path
      d="M28 72 L50 52 L72 72"
      fill="none"
      :stroke="variant === 'tile' ? '#ffffff' : variant === 'color' ? `url(#purple-${uid})` : 'currentColor'"
      :opacity="variant === 'mono' ? 0.5 : 1"
      stroke-width="13"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- Chevron du haut -->
    <path
      d="M24 52 L50 28 L76 52"
      fill="none"
      :stroke="variant === 'mono' ? 'currentColor' : `url(#gold-${uid})`"
      stroke-width="13"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

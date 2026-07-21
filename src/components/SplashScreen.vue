<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import LogoMark from './LogoMark.vue'

const emit = defineEmits<{ finished: [] }>()

const root = ref<HTMLElement | null>(null)
const logo = ref<HTMLElement | null>(null)
const word = ref<HTMLElement | null>(null)

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    gsap.to(root.value, { opacity: 0, duration: 0.3, delay: 0.6, onComplete: () => emit('finished') })
    return
  }
  gsap
    .timeline({ onComplete: () => emit('finished') })
    .from(logo.value, { scale: 0.4, opacity: 0, duration: 0.55, ease: 'back.out(1.7)' })
    .from(word.value, { y: 18, opacity: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2')
    .to({}, { duration: 0.4 })
    .to(root.value, { opacity: 0, duration: 0.45, ease: 'power1.inOut' })
})
</script>

<template>
  <div ref="root" class="splash">
    <div ref="logo" class="splash-logo"><LogoMark :size="88" variant="tile" /></div>
    <div ref="word" class="splash-word">Financia</div>
  </div>
</template>

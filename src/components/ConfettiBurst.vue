<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'

const emit = defineEmits<{ done: [] }>()
const root = ref<HTMLElement | null>(null)

const COLORS = ['#f8d299', '#f59e51', '#804a8a', '#34d399', '#ffffff']
const COUNT = 26

onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !root.value) {
    emit('done')
    return
  }
  const pieces = Array.from(root.value.children) as HTMLElement[]
  const tl = gsap.timeline({ onComplete: () => emit('done') })
  pieces.forEach((el, i) => {
    const angle = Math.random() * Math.PI * 2
    const distance = 90 + Math.random() * 140
    const x = Math.cos(angle) * distance
    const y = Math.sin(angle) * distance * 0.6 - 30
    tl.fromTo(
      el,
      { x: 0, y: 0, opacity: 1, scale: 0.6 + Math.random() * 0.6, rotate: 0 },
      {
        x,
        y: y + 260,
        opacity: 0,
        rotate: (Math.random() - 0.5) * 720,
        duration: 1.1 + Math.random() * 0.4,
        ease: 'power2.out'
      },
      i * 0.012
    )
  })
})
</script>

<template>
  <div ref="root" class="confetti" aria-hidden="true">
    <span
      v-for="i in COUNT"
      :key="i"
      class="confetti-piece"
      :style="{ background: COLORS[i % COLORS.length] }"
    />
  </div>
</template>

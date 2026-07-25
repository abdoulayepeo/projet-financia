<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{ title: string; open?: boolean; hint?: string }>(),
  { open: false, hint: '' }
)

const isOpen = ref(props.open)
</script>

<template>
  <section class="card collapsible" :class="{ open: isOpen }">
    <button
      type="button"
      class="collapsible-head"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <div class="collapsible-title">
        <slot name="icon" />
        <span>{{ title }}</span>
      </div>
      <ChevronDown :size="20" class="collapsible-chevron" />
    </button>
    <Transition name="collapse">
      <div v-if="isOpen" class="collapsible-body">
        <p v-if="hint" class="hint">{{ hint }}</p>
        <slot />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { toastState } from '../composables/toast'
</script>

<template>
  <Transition name="toast">
    <div v-if="toastState" :key="toastState.id" class="toast" role="status" aria-live="polite">
      <Check :size="16" /> {{ toastState.text }}
    </div>
  </Transition>
</template>

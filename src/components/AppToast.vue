<script setup lang="ts">
import { Check, Undo2 } from 'lucide-vue-next'
import { dismissToast, toastState } from '../composables/toast'

function runAction() {
  toastState.value?.action?.run()
  dismissToast()
}
</script>

<template>
  <Transition name="toast">
    <div v-if="toastState" :key="toastState.id" class="toast" role="status" aria-live="polite">
      <Check :size="16" /> {{ toastState.text }}
      <button v-if="toastState.action" type="button" class="toast-action" @click="runAction">
        <Undo2 :size="14" /> {{ toastState.action.label }}
      </button>
    </div>
  </Transition>
</template>

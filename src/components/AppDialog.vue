<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { dialogState, resolveDialog } from '../composables/dialog'

const inputRef = ref<HTMLInputElement | null>(null)
const okRef = ref<HTMLButtonElement | null>(null)

watch(
  () => dialogState.open,
  async (open) => {
    if (!open) return
    await nextTick()
    if (dialogState.kind === 'prompt') {
      inputRef.value?.focus()
      inputRef.value?.select()
    } else {
      okRef.value?.focus()
    }
  }
)

function onKey(e: KeyboardEvent) {
  if (dialogState.open && e.key === 'Escape') resolveDialog(false)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="dlg">
    <div v-if="dialogState.open" class="dialog-overlay" @click.self="resolveDialog(false)">
      <div class="dialog-card" role="dialog" aria-modal="true">
        <h3 v-if="dialogState.title" class="dialog-title">{{ dialogState.title }}</h3>
        <p v-if="dialogState.message" class="dialog-msg">{{ dialogState.message }}</p>
        <input
          v-if="dialogState.kind === 'prompt'"
          ref="inputRef"
          v-model="dialogState.value"
          class="dialog-input"
          type="text"
          maxlength="40"
          :placeholder="dialogState.placeholder"
          @keydown.enter="resolveDialog(true)"
        />
        <div class="dialog-actions">
          <button
            v-if="dialogState.kind !== 'alert'"
            type="button"
            class="dlg-cancel"
            @click="resolveDialog(false)"
          >
            {{ dialogState.cancelLabel }}
          </button>
          <button
            ref="okRef"
            type="button"
            class="dlg-ok"
            :class="{ danger: dialogState.danger }"
            @click="resolveDialog(true)"
          >
            {{ dialogState.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

export interface SelectOption {
  value: string
  label: string
  /** Pastille de couleur affichée devant l'option (catégories) */
  color?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    placeholder?: string
    ariaLabel?: string
  }>(),
  { placeholder: 'Choisir…' }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const listId = useId()
const triggerRef = ref<HTMLButtonElement | null>(null)
const optionRefs = ref<(HTMLLIElement | null)[]>([])

const selected = () => props.options.find((o) => o.value === props.modelValue) ?? null

function toggle() {
  open.value ? close() : openMenu()
}

async function openMenu() {
  open.value = true
  await nextTick()
  const idx = Math.max(
    props.options.findIndex((o) => o.value === props.modelValue),
    0
  )
  optionRefs.value[idx]?.focus()
}

function close() {
  open.value = false
  triggerRef.value?.focus()
}

function choose(value: string) {
  emit('update:modelValue', value)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  const idx = optionRefs.value.findIndex((el) => el === document.activeElement)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    optionRefs.value[Math.min(idx + 1, props.options.length - 1)]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    optionRefs.value[Math.max(idx - 1, 0)]?.focus()
  } else if (e.key === 'Escape') {
    close()
  }
}

watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="custom-select">
    <button
      ref="triggerRef"
      type="button"
      class="select-trigger"
      :class="{ 'is-open': open, 'is-placeholder': !modelValue }"
      :aria-label="ariaLabel"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="select-trigger-value">
        <span v-if="selected()?.color" class="dot" :style="{ background: selected()!.color }"></span>
        {{ selected()?.label ?? placeholder }}
      </span>
      <ChevronDown :size="18" class="select-chevron" />
    </button>

    <Teleport to="body">
      <Transition name="dlg">
        <div v-if="open" class="dialog-overlay select-overlay" @click.self="close">
          <ul :id="listId" class="select-menu" role="listbox" :aria-label="ariaLabel">
            <li
              v-for="o in options"
              :key="o.value"
              ref="optionRefs"
              role="option"
              tabindex="0"
              class="select-option"
              :aria-selected="o.value === modelValue"
              @click="choose(o.value)"
              @keydown.enter="choose(o.value)"
              @keydown.space.prevent="choose(o.value)"
            >
              <span v-if="o.color" class="dot" :style="{ background: o.color }"></span>
              <span class="select-option-label">{{ o.label }}</span>
              <Check v-if="o.value === modelValue" :size="18" class="select-option-check" />
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

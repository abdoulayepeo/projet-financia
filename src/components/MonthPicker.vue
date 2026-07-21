<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { formatMonth } from '../lib/format'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function shift(delta: number) {
  const [year, month] = props.modelValue.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  emit('update:modelValue', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}
</script>

<template>
  <div class="month-picker">
    <button type="button" @click="shift(-1)" aria-label="Mois précédent"><ChevronLeft :size="20" /></button>
    <span class="month-label">{{ formatMonth(modelValue) }}</span>
    <button type="button" @click="shift(1)" aria-label="Mois suivant"><ChevronRight :size="20" /></button>
  </div>
</template>

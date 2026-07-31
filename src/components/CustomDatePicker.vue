<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    ariaLabel?: string
    /** Autorise à vider la date (champs optionnels comme une échéance) */
    clearable?: boolean
  }>(),
  { placeholder: 'Choisir une date', clearable: false }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

function parse(iso: string): Date | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const open = ref(false)
const today = new Date()
const selectedDate = computed(() => parse(props.modelValue))

const viewYear = ref((selectedDate.value ?? today).getFullYear())
const viewMonth = ref((selectedDate.value ?? today).getMonth())

const label = computed(() => {
  const d = selectedDate.value
  if (!d) return props.placeholder
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})

const days = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  // Grille du lundi précédant (ou égal à) le 1er du mois, sur 6 semaines.
  const startOffset = (first.getDay() + 6) % 7
  const gridStart = new Date(viewYear.value, viewMonth.value, 1 - startOffset)
  const out: { date: Date; outside: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    out.push({ date: d, outside: d.getMonth() !== viewMonth.value })
  }
  return out
})

function openPicker() {
  const base = selectedDate.value ?? today
  viewYear.value = base.getFullYear()
  viewMonth.value = base.getMonth()
  open.value = true
}

function close() {
  open.value = false
}

function prevMonth() {
  const d = new Date(viewYear.value, viewMonth.value - 1, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function nextMonth() {
  const d = new Date(viewYear.value, viewMonth.value + 1, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function pick(d: Date) {
  emit('update:modelValue', toIso(d))
  close()
}

function pickToday() {
  pick(today)
}

function clear() {
  emit('update:modelValue', '')
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(open, (isOpen) => {
  if (isOpen) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="custom-date">
    <button
      type="button"
      class="select-trigger"
      :class="{ 'is-open': open, 'is-placeholder': !modelValue }"
      :aria-label="ariaLabel"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="openPicker"
    >
      <span class="select-trigger-value"><Calendar :size="16" /> {{ label }}</span>
    </button>

    <Teleport to="body">
      <Transition name="dlg">
        <div v-if="open" class="dialog-overlay" @click.self="close">
          <div class="date-card" role="dialog" aria-modal="true" :aria-label="ariaLabel || 'Choisir une date'">
            <div class="date-head">
              <button type="button" class="icon-btn" aria-label="Mois précédent" @click="prevMonth">
                <ChevronLeft :size="20" />
              </button>
              <span class="date-head-label">{{ MONTH_LABELS[viewMonth] }} {{ viewYear }}</span>
              <button type="button" class="icon-btn" aria-label="Mois suivant" @click="nextMonth">
                <ChevronRight :size="20" />
              </button>
            </div>

            <div class="date-weekdays">
              <span v-for="(w, i) in WEEKDAYS" :key="i">{{ w }}</span>
            </div>

            <div class="date-grid">
              <button
                v-for="cell in days"
                :key="cell.date.toISOString()"
                type="button"
                class="date-cell"
                :class="{
                  outside: cell.outside,
                  selected: selectedDate && sameDay(cell.date, selectedDate),
                  today: sameDay(cell.date, today)
                }"
                @click="pick(cell.date)"
              >
                {{ cell.date.getDate() }}
              </button>
            </div>

            <div class="date-actions">
              <button type="button" class="btn-secondary" @click="pickToday">Aujourd'hui</button>
              <button v-if="clearable && modelValue" type="button" class="btn-secondary" @click="clear">
                <X :size="15" /> Effacer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

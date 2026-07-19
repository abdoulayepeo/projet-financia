<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart, ArcElement, Tooltip } from 'chart.js'
import { colorFor } from '../categories'

Chart.register(ArcElement, Tooltip)

const props = defineProps<{ data: { category: string; total: number }[] }>()

const chartData = computed(() => ({
  labels: props.data.map((d) => d.category),
  datasets: [
    {
      data: props.data.map((d) => d.total),
      backgroundColor: props.data.map((d) => colorFor(d.category)),
      borderWidth: 0
    }
  ]
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false } }
} as const
</script>

<template>
  <div class="chart-wrap">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>

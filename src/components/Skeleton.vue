<script setup lang="ts">
withDefaults(
  defineProps<{ width?: string; height?: string; radius?: string; block?: boolean }>(),
  { width: '100%', height: '1rem', radius: '8px', block: false }
)
</script>

<template>
  <span
    class="skeleton"
    :class="{ block }"
    :style="{ width, height, borderRadius: radius }"
    aria-hidden="true"
  />
</template>

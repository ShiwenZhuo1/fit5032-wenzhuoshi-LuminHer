<template>
  <div class="d-inline-flex align-items-center">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="btn btn-link p-0 me-1 star"
      :aria-label="`rate ${n}`"
      @mouseenter="hover=n"
      @mouseleave="hover=0"
      @click="$emit('update:modelValue', n)"
    >
      <i :class="iconClass(n)"></i>
    </button>
    <small v-if="showValue" class="text-muted ms-1">{{ modelValue.toFixed(1) }}</small>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// props: modelValue is current selected (or avg)
// if interactive=false -> display only
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  interactive: { type: Boolean, default: true },
  showValue: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const hover = ref(0)

function iconClass(n) {
  const filled = (hover.value || props.modelValue) >= n
  return [
    'bi',
    filled ? 'bi-star-fill' : 'bi-star',
    props.interactive ? 'text-warning' : 'text-secondary'
  ]
}
</script>

<style scoped>
.star { font-size: 1.25rem }
.star .bi { font-size: 1.25rem }
</style>
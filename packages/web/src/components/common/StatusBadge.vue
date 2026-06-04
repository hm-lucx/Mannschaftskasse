<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="classes"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const config: Record<string, { label: string; classes: string }> = {
  OPEN: { label: 'Offen', classes: 'bg-red-100 text-red-800' },
  PAID: { label: 'Bezahlt', classes: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Storniert', classes: 'bg-gray-100 text-gray-600' },
  ACCEPTED: { label: 'Zugesagt', classes: 'bg-green-100 text-green-800' },
  DECLINED: { label: 'Abgesagt', classes: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Ausstehend', classes: 'bg-yellow-100 text-yellow-800' },
  TRAINING: { label: 'Training', classes: 'bg-blue-100 text-blue-800' },
  MATCH: { label: 'Spiel', classes: 'bg-purple-100 text-purple-800' },
  OTHER: { label: 'Sonstiges', classes: 'bg-gray-100 text-gray-700' },
  INCOME: { label: 'Einnahme', classes: 'bg-green-100 text-green-800' },
  EXPENSE: { label: 'Ausgabe', classes: 'bg-red-100 text-red-800' },
};

const label = computed(() => config[props.status]?.label || props.status);
const classes = computed(() => config[props.status]?.classes || 'bg-gray-100 text-gray-700');
</script>

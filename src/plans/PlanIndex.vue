<template>
  <div class="container my-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0 fw-bold">Plans</h2>
      <RouterLink class="btn btn-primary" :to="{ name: 'planForm' }">
        Create New Plan
      </RouterLink>
    </div>

    <div v-if="!submitted.length" class="text-center py-5 border rounded-3 bg-light">
      <p class="mb-3 text-muted">No saved plans yet.</p>
      <RouterLink class="btn btn-outline-dark" :to="{ name: 'planForm' }">
        Start your first plan
      </RouterLink>
    </div>

    <div v-else>
      <h5 class="mb-3">Saved drafts</h5>
      <div class="w-100 overflow-auto">
        <DataTable :value="submitted" :scrollable="true" scrollHeight="400px" tableStyle="min-width:70rem">
          <Column header="Profile">
            <template #body="{ data }">{{ formatProfile(data) }}</template>
          </Column>
          <Column header="Activity">
            <template #body="{ data }">{{ formatActivity(data) }}</template>
          </Column>
          <Column header="Training">
            <template #body="{ data }">{{ formatTraining(data) }}</template>
          </Column>
          <Column header="Nutrition">
            <template #body="{ data }">{{ formatNutrition(data) }}</template>
          </Column>
          <Column header="Coaching">
            <template #body="{ data }">{{ formatCoaching(data) }}</template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const STORAGE = 'luminher_plans'
const submitted = ref(readAll())

function readAll () {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]') } catch { return [] }
}

function kg(v){ return v ?? v===0 ? `${Number(v).toFixed(0)} kg` : '—' }

function formatProfile(row){
  const p = row.profile || {}
  const sex = p.sex || '—'
  const h = p.height_cm ? `${p.height_cm} cm` : '—'
  const weights = (p.weight_current_kg && p.weight_goal_kg)
    ? `${kg(p.weight_current_kg)} → ${kg(p.weight_goal_kg)}`
    : (p.weight_current_kg ? kg(p.weight_current_kg) : '—')
  const date = p.target_date || 'no date'
  return `${sex}, ${h}, ${weights} • target ${date}`
}
function formatActivity(row){
  const a = row.lifestyle || {}
  const lvl = a.activity_level || '—'
  const days = a.workout_days_per_week ?? a.workout_days ?? '0'
  const sleep = a.sleep_hours ? `${a.sleep_hours}h` : '—'
  const stress = a.stress || '—'
  return `${lvl} • ${days} d/wk • sleep ${sleep} • stress ${stress}`
}
function formatTraining(row){
  const t = row.training || {}
  const goal = t.goal || '—'
  const loc = t.location || '—'
  const eq = t.equipment && t.equipment.length ? t.equipment.join(', ') : 'none'
  const note = t.constraints ? ` • note: ${t.constraints}` : ''
  return `${goal} • ${loc} • eq: ${eq}${note}`
}
function formatNutrition(row){
  const n = row.nutrition || {}
  const style = n.diet_style || 'Any'
  const avoid = n.allergies && n.allergies.length ? n.allergies.join(', ') : '—'
  const budget = n.budget || '—'
  const cook = n.cook_time || '—'
  const meals = n.meals_per_day ? `${n.meals_per_day}/day` : '—'
  return `${style} • avoid: ${avoid} • budget ${budget} • cook ${cook} • ${meals}`
}
function strictnessLabelFromRow(v){
  if (v >= 0.8) return 'Very strict'
  if (v >= 0.6) return 'Strict'
  if (v >= 0.4) return 'Balanced'
  if (v >= 0.2) return 'Flexible'
  return 'Very flexible'
}
function formatCoaching(row){
  const c = row.coaching || {}
  const pace = c.weekly_loss_kg || c.weekly_loss_kg===0 ? `${Number(c.weekly_loss_kg).toFixed(2)} kg/wk` : '—'
  const protein = c.protein_high ? 'High protein' : 'Normal protein'
  const strict = strictnessLabelFromRow(c.strictness ?? 0.6)
  return `${pace} • ${protein} • ${strict}`
}
</script>
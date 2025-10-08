<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

// Local storage key for saved plans
const STORAGE = 'luminher_plans'
const submitted = ref(readAll())

// Read all plans from browser localStorage
function readAll () {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]') }
  catch { return [] }
}

// ---- Formatters ----
function kg(v){ return v ?? v===0 ? `${Number(v).toFixed(0)} kg` : '—' }
function formatProfile(row){ /* your original function here */ }
function formatActivity(row){ /* your original function here */ }
function formatTraining(row){ /* your original function here */ }
function formatNutrition(row){ /* your original function here */ }
function strictnessLabelFromRow(v){ /* your original function here */ }
function formatCoaching(row){ /* your original function here */ }

// ---- Filters and Search ----
const globalFilter = ref('')
const filters = ref({
  global: { value: null, matchMode: 'contains' },
  goal:     { value: null, matchMode: 'contains' },
  diet:     { value: null, matchMode: 'contains' },
  activity: { value: null, matchMode: 'contains' },
})

// Create formatted table data for DataTable
const tableData = computed(() => submitted.value.map(p => ({
  raw: p,
  profile: formatProfile(p),
  activityTxt: formatActivity(p),
  trainingTxt: formatTraining(p),
  nutritionTxt: formatNutrition(p),
  coachingTxt: formatCoaching(p),
  goal: p?.training?.goal || '',
  diet: p?.nutrition?.diet_style || '',
  activity: p?.lifestyle?.activity_level || '',
})))
</script>

<template>
  <div class="container my-4">
    <!-- Page header -->
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0 fw-bold">Plans</h2>
      <RouterLink class="btn btn-primary" :to="{ name: 'planForm' }">Create New Plan</RouterLink>
    </div>

    <!-- Empty state -->
    <div v-if="!submitted.length" class="text-center py-5 border rounded-3 bg-light">
      <p class="mb-3 text-muted">No saved plans yet.</p>
      <RouterLink class="btn btn-outline-dark" :to="{ name: 'planForm' }">Start your first plan</RouterLink>
    </div>

    <!-- Data table -->
    <div v-else class="card shadow-sm">
      <div class="card-body">
        <!-- Search bar and column filters -->
        <div class="d-flex gap-2 mb-3">
          <!-- Global search -->
          <span class="input-icon position-relative" style="max-width:280px">
            <i class="pi pi-search position-absolute" style="left:10px; top:10px;"></i>
            <InputText
              v-model="globalFilter"
              placeholder="Search all columns"
              class="form-control ps-5"
            />
          </span>

          <!-- Column-specific filters -->
          <InputText v-model="filters.goal.value" placeholder="Filter: Goal" class="form-control" />
          <InputText v-model="filters.diet.value" placeholder="Filter: Diet" class="form-control" />
          <InputText v-model="filters.activity.value" placeholder="Filter: Activity" class="form-control" />
        </div>

        <!-- PrimeVue DataTable -->
        <DataTable
          :value="tableData"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10,20,50]"
          :globalFilterFields="['profile','activityTxt','trainingTxt','nutritionTxt','coachingTxt','goal','diet','activity']"
          :filters="{
            global:{ value: globalFilter, matchMode: 'contains' },
            goal: filters.goal,
            diet: filters.diet,
            activity: filters.activity
          }"
          dataKey="id"
          responsiveLayout="scroll"
          stripedRows
        >
          <Column header="Profile" sortable field="profile">
            <template #body="{ data }">{{ data.profile }}</template>
          </Column>
          <Column header="Activity" sortable field="activityTxt">
            <template #body="{ data }">{{ data.activityTxt }}</template>
          </Column>
          <Column header="Training" sortable field="trainingTxt">
            <template #body="{ data }">{{ data.trainingTxt }}</template>
          </Column>
          <Column header="Nutrition" sortable field="nutritionTxt">
            <template #body="{ data }">{{ data.nutritionTxt }}</template>
          </Column>
          <Column header="Coaching" sortable field="coachingTxt">
            <template #body="{ data }">{{ data.coachingTxt }}</template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-icon .pi { color:#9aa0a6 }
</style>
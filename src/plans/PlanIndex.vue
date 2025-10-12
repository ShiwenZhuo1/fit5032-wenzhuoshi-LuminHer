<!-- src/plans/PlanIndex.vue -->
<template>
  <div class="container my-4">
    <div class="d-flex justify-content-between align-items-center flex-wrap mb-4">
      <h2 class="fw-bold m-0">My Plans</h2>
      <div class="d-flex gap-2 flex-wrap">
        <input
          v-model="query"
          type="text"
          class="form-control"
          placeholder="Search by goal or diet..."
          style="min-width: 220px"
        />
        <RouterLink class="btn btn-primary" :to="{ name: 'planForm' }">
          + Create New Plan
        </RouterLink>
        <button v-if="plans.length" class="btn btn-outline-danger" @click="clearAll">
          Clear All
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!filteredPlans.length" class="text-muted text-center py-5">
      <p class="mb-2">No plans found.</p>
      <RouterLink class="btn btn-sm btn-dark" :to="{ name: 'planForm' }">
        Create your first plan
      </RouterLink>
    </div>

    <!-- Plans grid -->
    <div v-else class="row g-3">
      <div v-for="(p, i) in filteredPlans" :key="i" class="col-12 col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h5 class="card-title fw-bold mb-2">
              {{ p.training?.goal || 'Unnamed Plan' }}
            </h5>
            <p class="card-text small mb-2">
              <strong>Diet:</strong> {{ p.nutrition?.diet_style || '—' }}<br />
              <strong>Activity:</strong> {{ p.lifestyle?.activity_level || '—' }}<br />
              <strong>Target:</strong> {{ p.profile?.weight_goal_kg }} kg by
              {{ p.profile?.target_date || '—' }}
            </p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <RouterLink
                class="btn btn-sm btn-outline-primary"
                :to="{ name: 'planDetail', params: { id: i } }"
              >
                View
              </RouterLink>
              <button class="btn btn-sm btn-outline-danger" @click="removePlan(i)">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'

const auth = useAuth()

// Email-scoped localStorage key
const STORAGE_PREFIX = 'luminher_plans_'
const storageKey = () => STORAGE_PREFIX + (auth.user?.email || 'guest').toLowerCase()

const plans = ref([])
const query = ref('')

// Load plans for current user
function loadPlans() {
  try {
    plans.value = JSON.parse(localStorage.getItem(storageKey()) || '[]')
  } catch {
    plans.value = []
  }
}

// Persist changes
function savePlans() {
  localStorage.setItem(storageKey(), JSON.stringify(plans.value))
}

// Delete a single plan
function removePlan(i) {
  if (!confirm('Delete this plan?')) return
  plans.value.splice(i, 1)
  savePlans()
}

// Clear all plans
function clearAll() {
  if (!confirm('Clear all your plans?')) return
  plans.value = []
  savePlans()
}

// Search by goal/diet
const filteredPlans = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return plans.value
  return plans.value.filter(
    p =>
      (p.training?.goal || '').toLowerCase().includes(q) ||
      (p.nutrition?.diet_style || '').toLowerCase().includes(q)
  )
})

onMounted(loadPlans)
</script>

<style scoped>
.card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
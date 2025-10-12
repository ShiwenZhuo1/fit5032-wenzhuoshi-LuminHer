<!-- src/plans/PlanDetail.vue -->
<template>
  <div class="container my-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="fw-bold mb-0">Plan Details</h2>
      <RouterLink class="btn btn-outline-secondary btn-sm" :to="{ name: 'plans' }">
        ← Back to My Plans
      </RouterLink>
    </div>

    <!-- Not found -->
    <div v-if="!plan" class="alert alert-light border text-muted text-center py-5">
      <p class="mb-2">Plan not found or invalid ID.</p>
      <RouterLink class="btn btn-sm btn-primary" :to="{ name: 'plans' }">Go Back</RouterLink>
    </div>

    <!-- Details -->
    <div v-else class="card shadow-sm border-0">
      <div class="card-body p-4">
        <h4 class="fw-bold mb-3">{{ plan.training?.goal || 'Unnamed Plan' }}</h4>
        <div class="row g-3">
          <!-- Profile -->
          <div class="col-12 col-md-6">
            <h6 class="fw-bold border-bottom pb-1">Profile</h6>
            <p class="small mb-1"><strong>Sex:</strong> {{ plan.profile?.sex || '—' }}</p>
            <p class="small mb-1"><strong>Height:</strong> {{ plan.profile?.height_cm }} cm</p>
            <p class="small mb-1">
              <strong>Weight:</strong> {{ plan.profile?.weight_current_kg }} → {{ plan.profile?.weight_goal_kg }} kg
            </p>
            <p class="small mb-1"><strong>Target Date:</strong> {{ plan.profile?.target_date || '—' }}</p>
          </div>

          <!-- Activity -->
          <div class="col-12 col-md-6">
            <h6 class="fw-bold border-bottom pb-1">Activity</h6>
            <p class="small mb-1"><strong>Activity Level:</strong> {{ plan.lifestyle?.activity_level || '—' }}</p>
            <p class="small mb-1"><strong>Workout Days:</strong> {{ plan.lifestyle?.workout_days_per_week || 0 }} / week</p>
            <p class="small mb-1"><strong>Sleep:</strong> {{ plan.lifestyle?.sleep_hours || '—' }} hrs</p>
            <p class="small mb-1"><strong>Stress:</strong> {{ plan.lifestyle?.stress || '—' }}</p>
          </div>

          <!-- Nutrition -->
          <div class="col-12 col-md-6">
            <h6 class="fw-bold border-bottom pb-1">Nutrition</h6>
            <p class="small mb-1"><strong>Diet Style:</strong> {{ plan.nutrition?.diet_style || '—' }}</p>
            <p class="small mb-1"><strong>Allergies:</strong> {{ plan.nutrition?.allergies?.join(', ') || 'None' }}</p>
            <p class="small mb-1"><strong>Budget:</strong> {{ plan.nutrition?.budget || '—' }}</p>
            <p class="small mb-1"><strong>Meals/day:</strong> {{ plan.nutrition?.meals_per_day || '—' }}</p>
          </div>

          <!-- Training -->
          <div class="col-12 col-md-6">
            <h6 class="fw-bold border-bottom pb-1">Training</h6>
            <p class="small mb-1"><strong>Goal:</strong> {{ plan.training?.goal || '—' }}</p>
            <p class="small mb-1"><strong>Experience:</strong> {{ plan.training?.experience || '—' }}</p>
            <p class="small mb-1"><strong>Location:</strong> {{ plan.training?.location || '—' }}</p>
            <p class="small mb-1"><strong>Equipment:</strong> {{ plan.training?.equipment?.join(', ') || 'None' }}</p>
            <p class="small mb-1"><strong>Constraints:</strong> {{ plan.training?.constraints || '—' }}</p>
          </div>

          <!-- Coaching -->
          <div class="col-12 col-md-6">
            <h6 class="fw-bold border-bottom pb-1">Coaching</h6>
            <p class="small mb-1"><strong>Weekly Loss:</strong> {{ plan.coaching?.weekly_loss_kg || '—' }} kg/wk</p>
            <p class="small mb-1"><strong>Protein:</strong> {{ plan.coaching?.protein_high ? 'High' : 'Normal' }}</p>
            <p class="small mb-1"><strong>Strictness:</strong> {{ formatStrictness(plan.coaching?.strictness || 0.5) }}</p>
          </div>

          <!-- Reminders -->
          <div class="col-12 col-md-6">
            <h6 class="fw-bold border-bottom pb-1">Reminders</h6>
            <p class="small mb-1"><strong>Weigh-in:</strong> {{ plan.reminders?.weigh_in || 'Off' }}</p>
            <p class="small mb-1"><strong>Water Reminder:</strong> {{ plan.reminders?.water ? 'On' : 'Off' }}</p>
            <p class="small mb-1"><strong>Timezone:</strong> {{ plan.reminders?.timezone || '—' }}</p>
          </div>
        </div>

        <div class="d-flex justify-content-end mt-4">
          <button class="btn btn-outline-danger" @click="deletePlan">Delete Plan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Shows a single plan (by index) from the current user's localStorage namespace
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuth } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const STORAGE_PREFIX = 'luminher_plans_'
const storageKey = () => STORAGE_PREFIX + (auth.user?.email || 'guest').toLowerCase()

const plan = ref(null)
const planIndex = ref(Number(route.params.id || -1))

function loadPlan() {
  try {
    const list = JSON.parse(localStorage.getItem(storageKey()) || '[]')
    plan.value = list[planIndex.value] || null
  } catch {
    plan.value = null
  }
}

function formatStrictness(v) {
  if (v >= 0.8) return 'Very strict'
  if (v >= 0.6) return 'Strict'
  if (v >= 0.4) return 'Balanced'
  if (v >= 0.2) return 'Flexible'
  return 'Very flexible'
}

function deletePlan() {
  if (!confirm('Delete this plan?')) return
  const list = JSON.parse(localStorage.getItem(storageKey()) || '[]')
  list.splice(planIndex.value, 1)
  localStorage.setItem(storageKey(), JSON.stringify(list))
  router.push({ name: 'plans' })
}

onMounted(loadPlan)
</script>

<style scoped>
.card { border-radius: 0.75rem; }
h6 { color: #333; }
p { margin-bottom: 0.3rem; }
</style>
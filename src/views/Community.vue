<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">Community plans</h2>
      <RouterLink class="btn btn-primary" :to="{ name: 'planForm' }">Create / Share a plan</RouterLink>
    </div>

    <div v-if="!items.length" class="alert alert-light border">
      No shared plans yet. Be the first to share yours!
    </div>

    <div class="row g-3">
      <div v-for="p in items" :key="p.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title d-flex align-items-center justify-content-between">
              <span>{{ p.title }}</span>
              <span class="badge text-bg-light">{{ p.count }} ratings</span>
            </h5>

            <p class="text-secondary small mb-2">
              By {{ p.ownerName }} • {{ formatDate(p.createdAt) }}
            </p>

            <!-- average display -->
            <div class="mb-2">
              <StarRating :model-value="p.avg" :interactive="false" :showValue="true" />
            </div>

            <!-- my rating (if logged in) -->
            <div v-if="isAuthed" class="mt-2">
              <label class="form-label small">Your rating</label>
              <StarRating :model-value="myRating(p)" @update:modelValue="v => rate(p.id, v)" />
            </div>

            <!-- tiny preview: you can expand as needed -->
            <ul class="small mt-3 mb-0">
              <li>Goal: {{ p.payload.training?.goal || '—' }}</li>
              <li>Activity: {{ p.payload.lifestyle?.activity_level || '—' }}</li>
              <li>Diet: {{ p.payload.nutrition?.diet_style || '—' }}</li>
            </ul>
          </div>

          <div class="card-footer bg-white d-flex justify-content-between">
            <button
              v-if="isOwner(p)"
              class="btn btn-outline-danger btn-sm"
              @click="remove(p.id)"
            >
              Delete
            </button>
            <small class="text-muted ms-auto">Avg: {{ p.avg.toFixed(2) }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StarRating from '../components/StarRating.vue'
import { useRatings } from '../stores/ratings'
import { useAuth } from '../stores/auth'

const ratings = useRatings()
const auth = useAuth()

const isAuthed = computed(() => auth.isAuthenticated)
const items = computed(() => ratings.withStats)

function myRating(p) {
  const email = auth.user?.email
  return (p.ratings && email) ? (p.ratings[email] || 0) : 0
}
function rate(id, v) {
  if (!auth.isAuthenticated) return
  ratings.rate(id, auth.user.email, v)
}
function isOwner(p) {
  return auth.isAuthenticated && p.ownerEmail === auth.user?.email
}
function remove(id) {
  if (confirm('Delete this shared plan?')) {
    ratings.remove(id, auth.user.email)
  }
}
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
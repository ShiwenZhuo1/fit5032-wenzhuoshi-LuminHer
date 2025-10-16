// src/views/Community.vue
<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StarRating from '../components/StarRating.vue'
import { useRatings } from '../stores/ratings'
import { useAuth } from '../stores/auth'

// PrimeVue table pieces
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

// Stores
const ratings = useRatings()
const auth = useAuth()

// Whether current user is authenticated
const isAuthed = computed(() => auth.isAuthenticated)

// Original shared items enriched with flat fields for filtering
const rows = computed(() =>
  (ratings.withStats || []).map(p => ({
    ...p,
    goal: p?.payload?.training?.goal || '',
    activity: p?.payload?.lifestyle?.activity_level || '',
    diet: p?.payload?.nutrition?.diet_style || '',
  }))
)

// ---- Filters & search ----
const globalFilter = ref('')
const filters = ref({
  goal:     { value: null, matchMode: 'contains' },
  diet:     { value: null, matchMode: 'contains' },
  activity: { value: null, matchMode: 'contains' },
})

// ---- Helpers ----
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
function removeItem(id) {
  if (confirm('Delete this shared plan?')) ratings.remove(id, auth.user.email)
}
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="container py-4">
    <!-- Page header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">Community plans</h2>
      <div class="d-flex gap-2">
        <RouterLink class="btn btn-outline-secondary" :to="{ name: 'communityTable' }">
          View as Table
        </RouterLink>
        <RouterLink class="btn btn-primary" :to="{ name: 'planForm' }">
          Create / Share a plan
        </RouterLink>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!rows.length" class="alert alert-light border">
      No shared plans yet. Be the first to share yours!
    </div>

    <!-- Data table card -->
    <div v-else class="card shadow-sm">
      <div class="card-body">
        <!-- Global search + column filters -->
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
          <InputText v-model="filters.goal.value"     placeholder="Filter: Goal"     class="form-control" />
          <InputText v-model="filters.diet.value"     placeholder="Filter: Diet"     class="form-control" />
          <InputText v-model="filters.activity.value" placeholder="Filter: Activity" class="form-control" />
        </div>

        <!-- PrimeVue DataTable -->
        <DataTable
          :value="rows"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10,20,50]"
          dataKey="id"
          responsiveLayout="scroll"
          stripedRows
          :globalFilterFields="['title','ownerName','goal','activity','diet']"
          :filters="{
            global:{ value: globalFilter, matchMode: 'contains' },
            goal: filters.goal,
            diet: filters.diet,
            activity: filters.activity
          }"
        >
          <Column header="Title" field="title" sortable />
          <Column header="Owner" field="ownerName" sortable />
          <Column header="Goal" field="goal" sortable />
          <Column header="Activity" field="activity" sortable />
          <Column header="Diet" field="diet" sortable />

          <!-- Ratings column: average + user rating control -->
          <Column header="Ratings" field="avg" sortable>
            <template #body="{ data }">
              <div class="d-flex align-items-center gap-2">
                <StarRating :model-value="data.avg" :interactive="false" :showValue="true" />
                <small class="text-muted">({{ data.count }})</small>
              </div>
              <div v-if="isAuthed" class="mt-1">
                <label class="form-label small m-0">Your rating</label>
                <StarRating :model-value="myRating(data)" @update:modelValue="v => rate(data.id, v)" />
              </div>
            </template>
          </Column>

          <Column header="Created" field="createdAt" sortable>
            <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
          </Column>

          <!-- Owner-only actions -->
          <Column header="Actions" style="width:160px" class="text-center">
            <template #body="{ data }">
              <button
                v-if="isOwner(data)"
                class="btn btn-outline-danger btn-sm"
                @click="removeItem(data.id)"
              >
                Delete
              </button>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Subtle icon color for the search loupe */
.input-icon .pi { color:#9aa0a6 }
</style>
<template>
  <section class="container py-4">
    <h2 class="mb-3">User Dashboard</h2>
    <p class="text-muted">Welcome, {{ auth.user?.name || 'User' }}.</p>

    <div class="row g-3">
      <div class="col-12 col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">My Plan</h5>
            <p class="card-text">Create or update your fitness plan.</p>
            <RouterLink class="btn btn-primary" :to="{ name: 'plans' }">Open Plan Setup</RouterLink>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">Account</h5>
            <p class="card-text">Manage your profile and settings.</p>
            <RouterLink class="btn btn-outline-primary" :to="{ name: 'account' }">Go to Account</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useAuth } from '../../stores/auth'
const auth = useAuth()
</script>
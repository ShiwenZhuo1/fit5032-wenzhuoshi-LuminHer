<template>
  <section class="container py-5">
    <h1 class="h3 mb-3">Admin Panel</h1>
    <p class="text-secondary">
      Signed in as: <strong>{{ auth.user?.email }}</strong> (role: {{ auth.user?.role }})
    </p>

    <ul class="mt-3">
      <li>Manage users (placeholder)</li>
      <li>Review plans (placeholder)</li>
      <li>System settings (placeholder)</li>
    </ul>

    <div class="mt-4 d-flex gap-2">
      <RouterLink class="btn btn-primary" to="/dashboard">Back to User area</RouterLink>
      <button class="btn btn-outline-secondary" @click="logoutAndBack">Log out</button>
    </div>
  </section>
</template>

<script setup>
import { useRouter, RouterLink } from 'vue-router'
import { useAuth } from '../../stores/auth'

const auth = useAuth()
const router = useRouter()

function logoutAndBack() {
  auth.logout()
  router.push({ name: 'login' })
}
</script>
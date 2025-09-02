<template>
  <section class="container py-5">
    <h1 class="h3 mb-3">Welcome, {{ auth.user?.name || 'User' }}</h1>
    <p class="text-secondary">This is your user dashboard.</p>

    <div class="mt-4 d-flex gap-2">
      <RouterLink class="btn btn-primary" to="/plans">Go to Plan Setup</RouterLink>
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
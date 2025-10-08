<template>
  <nav class="navbar navbar-expand-lg bg-light border-bottom">
    <div class="container">
      <RouterLink class="navbar-brand fw-bold me-3" :to="{ name: 'home' }">LUMINHER</RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'plans' }">Plans</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'map' }">Map</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'progress' }">Progress</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'community' }">Community</RouterLink>
          </li>

          <template v-if="auth.ready && auth.isAuthenticated">
            <li class="nav-item" v-if="auth.isAdmin">
              <RouterLink class="nav-link" :to="{ name: 'adminHome' }">Admin</RouterLink>
            </li>
            <li class="nav-item" v-else>
              <RouterLink class="nav-link" :to="{ name: 'userHome' }">Dashboard</RouterLink>
            </li>
          </template>
        </ul>

        <div class="d-flex mt-3 mt-lg-0 align-items-center">
          <template v-if="auth.ready && !auth.isAuthenticated">
            <RouterLink :to="{ name: 'login' }" class="btn btn-outline-dark btn-sm me-2">Log in</RouterLink>
            <RouterLink :to="{ name: 'register' }" class="btn btn-dark btn-sm">Register</RouterLink>
          </template>

          <template v-else-if="auth.ready && auth.isAuthenticated">
            <span class="me-2 small text-muted">
              {{ auth.user?.displayName || auth.user?.email }}
              <span class="badge ms-1" :class="auth.isAdmin ? 'bg-dark' : 'bg-secondary'">
                {{ auth.role }}
              </span>
            </span>
            <button class="btn btn-outline-dark btn-sm" @click="onLogout">Logout</button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()

async function onLogout() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<style scoped>
.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(0,0,0,.7)' stroke-linecap='round' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}
.router-link-active.nav-link {
  font-weight: 600;
}
</style>
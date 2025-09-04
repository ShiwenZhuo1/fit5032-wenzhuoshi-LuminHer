<template>
  <nav class="navbar navbar-expand-lg bg-light border-bottom">
    <div class="container">
      <!-- Brand -->
      <RouterLink class="navbar-brand fw-bold me-3" to="/">LUMINHER</RouterLink>

      <!-- Toggler (mobile) -->
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

      <!-- Collapsible content -->
      <div class="collapse navbar-collapse" id="mainNav">
        <!-- Left: primary nav -->
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/plans">Plans</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/map">Map</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/progress">Progress</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/community">Community</RouterLink>
          </li>

          <!-- When signed in: show role-based dashboard link -->
          <template v-if="auth.isAuthenticated">
            <li class="nav-item" v-if="auth.user?.role === 'admin'">
              <RouterLink class="nav-link" :to="{ name: 'adminHome' }">Admin</RouterLink>
            </li>
            <li class="nav-item" v-else>
              <RouterLink class="nav-link" :to="{ name: 'userHome' }">Dashboard</RouterLink>
            </li>
          </template>
        </ul>

        <!-- Right: auth area -->
        <div class="d-flex mt-3 mt-lg-0 align-items-center">
          <!-- If not signed in: show login/register -->
          <template v-if="!auth.isAuthenticated">
            <RouterLink to="/auth/login" class="btn btn-outline-dark btn-sm me-2">Log in</RouterLink>
            <RouterLink to="/auth/register" class="btn btn-dark btn-sm">Register</RouterLink>
          </template>

          <!-- If signed in: show user + logout -->
          <template v-else>
            <!-- Small user pill -->
            <span class="me-2 small text-muted">
              {{ auth.user?.name || auth.user?.email }}
              <span class="badge ms-1" :class="auth.user?.role === 'admin' ? 'bg-dark' : 'bg-secondary'">
                {{ auth.user?.role }}
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
// Keep your RouterLink import
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

// Pinia store + router
const auth = useAuth()
const router = useRouter()

// Logout then go home
function onLogout() {
  auth.logout()
  router.push({ name: 'home' })
}
</script>

<style scoped>
/* Keep your existing styles */

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(0,0,0,.7)' stroke-linecap='round' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

/* Highlight active route */
.router-link-active.nav-link {
  font-weight: 600;
}
</style>
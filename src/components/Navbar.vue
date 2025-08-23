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
          <li class="nav-item">
            <RouterLink class="nav-link" to="/account">Account</RouterLink>
          </li>
        </ul>

        <!-- Right: CTA -->
        <div class="d-flex mt-3 mt-lg-0">
          <RouterLink to="/auth/login" class="btn btn-outline-dark btn-sm me-2">Log in</RouterLink>
          <RouterLink to="/auth/register" class="btn btn-dark btn-sm">Register</RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(0,0,0,.7)' stroke-linecap='round' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

.router-link-active.nav-link {
  font-weight: 600;
}
</style>
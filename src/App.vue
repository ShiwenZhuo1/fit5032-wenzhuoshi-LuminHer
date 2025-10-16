// src/App.vue
<template>
  <Navbar />

  <main class="py-4">
    <router-view />
  </main>

  <footer class="border-top mt-5">
    <div class="container py-4">
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <h6 class="fw-bold m-0">LUMINHER</h6>
          <small>© 2025 • Privacy • Terms</small>
        </div>
        <div class="col-6 col-md-4">
          <h6 class="fw-bold">Quick Links</h6>
          <ul class="list-unstyled m-0">
            <li><RouterLink to="/plans">Plans</RouterLink></li>
            <li><RouterLink to="/map">Map</RouterLink></li>
            <li><RouterLink to="/progress">Progress</RouterLink></li>
            <li><RouterLink to="/community">Community</RouterLink></li>
            <li><RouterLink to="/account">Account</RouterLink></li>
            <li><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>
            <li><RouterLink :to="{ name: 'register' }">Register</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-md-4">
          <h6 class="fw-bold">Contact</h6>
          <small>Email: hello@luminher.org</small><br />
          <small>Phone: (+61) 0000 0000</small>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import { RouterLink } from 'vue-router'
</script>
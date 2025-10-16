// src/views/Home.vue
<template>
  <div class="home-page">
    <!-- Hero -->
    <section class="bg-light border-bottom">
      <div class="container py-5">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-6">
            <h1 class="display-5 fw-bold mb-3">
              Build your plan. Track your journey.
            </h1>
            <p class="lead text-secondary mb-4">
              LuminHer helps you create a personalized fitness plan, explore routes on the map,
              and learn from the community — all in one place.
            </p>

            <div class="d-flex flex-wrap gap-2">
              <RouterLink
                v-if="!isAuthed"
                :to="{ name: 'register' }"
                class="btn btn-dark btn-lg"
                aria-label="Create an account"
              >
                Get started
              </RouterLink>
              <RouterLink
                v-if="!isAuthed"
                :to="{ name: 'login' }"
                class="btn btn-outline-dark btn-lg"
                aria-label="Log in"
              >
                Log in
              </RouterLink>

              <RouterLink
                v-if="isAuthed && isAdmin"
                :to="{ name: 'adminHome' }"
                class="btn btn-dark btn-lg"
                aria-label="Open admin dashboard"
              >
                Admin dashboard
              </RouterLink>
              <RouterLink
                v-if="isAuthed && !isAdmin"
                :to="{ name: 'userHome' }"
                class="btn btn-dark btn-lg"
                aria-label="Open user dashboard"
              >
                Go to dashboard
              </RouterLink>
              <RouterLink
                :to="{ name: 'plans' }"
                class="btn btn-outline-dark btn-lg"
                aria-label="Open plans"
              >
                Plans
              </RouterLink>
            </div>

            <ul class="list-unstyled d-flex flex-wrap gap-3 mt-4 text-secondary small m-0">
              <li class="d-flex align-items-center gap-2">
                <i class="pi pi-check"></i> Accessible UI (WCAG 2.1 AA)
              </li>
              <li class="d-flex align-items-center gap-2">
                <i class="pi pi-check"></i> Interactive tables
              </li>
              <li class="d-flex align-items-center gap-2">
                <i class="pi pi-check"></i> Map search & routing
              </li>
            </ul>
          </div>

          <div class="col-12 col-lg-6">
            <!-- Decorative card; replace with illustration if you like -->
            <div class="hero-card shadow-sm rounded-4 p-4 h-100 bg-white">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <h6 class="fw-bold m-0">Quick stats</h6>
                <span class="badge text-bg-dark">Live</span>
              </div>
              <div class="row g-3">
                <div class="col-6">
                  <div class="stat-tile rounded-4 border p-3 h-100">
                    <div class="text-secondary small">Your streak</div>
                    <div class="fs-3 fw-bold">{{ mock.streak }} days</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-tile rounded-4 border p-3 h-100">
                    <div class="text-secondary small">Community plans</div>
                    <div class="fs-3 fw-bold">{{ mock.community }}</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-tile rounded-4 border p-3 h-100">
                    <div class="text-secondary small">Avg. rating</div>
                    <div class="fs-3 fw-bold">{{ mock.rating }}★</div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-tile rounded-4 border p-3 h-100">
                    <div class="text-secondary small">Map routes saved</div>
                    <div class="fs-3 fw-bold">{{ mock.routes }}</div>
                  </div>
                </div>
              </div>

              <div class="mt-4 d-flex flex-wrap gap-2">
                <RouterLink :to="{ name: 'map' }" class="btn btn-primary">
                  <i class="pi pi-map-marker me-2"></i>Open map
                </RouterLink>
                <RouterLink :to="{ name: 'community' }" class="btn btn-outline-primary">
                  <i class="pi pi-users me-2"></i>Explore community
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="container py-5">
      <div class="row g-3">
        <div class="col-12 col-md-6 col-lg-3">
          <RouterLink :to="{ name: 'plans' }" class="card h-100 hover-card border-0 shadow-sm text-decoration-none">
            <div class="card-body">
              <div class="icon-wrap mb-2" aria-hidden="true"><i class="pi pi-list-check"></i></div>
              <h5 class="card-title text-dark">Create a plan</h5>
              <p class="card-text text-secondary">Answer a few questions and generate your personalized plan.</p>
            </div>
          </RouterLink>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <RouterLink :to="{ name: 'map' }" class="card h-100 hover-card border-0 shadow-sm text-decoration-none">
            <div class="card-body">
              <div class="icon-wrap mb-2" aria-hidden="true"><i class="pi pi-compass"></i></div>
              <h5 class="card-title text-dark">Find routes</h5>
              <p class="card-text text-secondary">Search places and get directions with travel time.</p>
            </div>
          </RouterLink>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <RouterLink :to="{ name: 'community' }" class="card h-100 hover-card border-0 shadow-sm text-decoration-none">
            <div class="card-body">
              <div class="icon-wrap mb-2" aria-hidden="true"><i class="pi pi-star"></i></div>
              <h5 class="card-title text-dark">Community</h5>
              <p class="card-text text-secondary">Share plans, rate others, and learn from the best tips.</p>
            </div>
          </RouterLink>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <RouterLink
            :to="isAdmin ? { name: 'adminHome' } : { name: 'account' }"
            class="card h-100 hover-card border-0 shadow-sm text-decoration-none"
          >
            <div class="card-body">
              <div class="icon-wrap mb-2" aria-hidden="true"><i class="pi pi-user"></i></div>
              <h5 class="card-title text-dark">{{ isAdmin ? 'Admin center' : 'Your account' }}</h5>
              <p class="card-text text-secondary">
                {{ isAdmin ? 'Manage users and roles.' : 'Update profile and security.' }}
              </p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-white border-top border-bottom">
      <div class="container py-5">
        <div class="text-center mb-4">
          <h3 class="fw-bold">Why LuminHer</h3>
          <p class="text-secondary m-0">Designed for clarity, speed, and accessibility.</p>
        </div>
        <div class="row g-3">
          <div class="col-12 col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="icon-lg" aria-hidden="true"><i class="pi pi-bolt"></i></div>
                <h5 class="fw-bold mt-2">Fast & simple</h5>
                <p class="text-secondary">Clean flows, minimal clicks — get from idea to plan quickly.</p>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="icon-lg" aria-hidden="true"><i class="pi pi-shield"></i></div>
                <h5 class="fw-bold mt-2">Secure by design</h5>
                <p class="text-secondary">Firebase Auth, serverless functions, and least-privilege data access.</p>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="card h-100 border-0 shadow-sm">
              <div class="card-body">
                <div class="icon-lg" aria-hidden="true"><i class="pi pi-eye"></i></div>
                <h5 class="fw-bold mt-2">Accessible</h5>
                <p class="text-secondary">Keyboard navigable forms and text alternatives for non-text content.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- How it works -->
        <div class="row g-3 mt-1">
          <div class="col-12 col-lg-8">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <h5 class="fw-bold mb-3">How it works</h5>
                <ol class="m-0 ps-3">
                  <li class="mb-2"><strong>Create</strong> your plan with the guided steps.</li>
                  <li class="mb-2"><strong>Explore</strong> the map for places and routes you love.</li>
                  <li class="mb-0"><strong>Share</strong> with the community and get feedback.</li>
                </ol>
              </div>
            </div>
          </div>
          <div class="col-12 col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <h5 class="fw-bold mb-3">What users say</h5>
                <blockquote class="small text-secondary m-0">
                  “Simple, fast, and surprisingly motivating.”
                  <footer class="text-muted mt-2">— A happy member</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>

        <!-- Integrations strip -->
        <div class="row g-3 mt-1 align-items-center">
          <div class="col-12 col-md-3"><div class="text-muted small">Powered by</div></div>
          <div class="col-12 col-md-9">
            <div class="d-flex flex-wrap gap-3 align-items-center logos">
              <img src="/vite.svg" alt="Vite" height="28" />
              <img src="/src/assets/vue.svg" alt="Vue" height="28" />
              <span class="badge text-bg-light border">Firebase</span>
              <span class="badge text-bg-light border">Mapbox</span>
              <span class="badge text-bg-light border">SendGrid</span>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- CTA band -->
    <section class="cta-band text-center">
      <div class="container py-5">
        <h3 class="fw-bold mb-2">Ready to start your journey?</h3>
        <p class="text-secondary mb-3">Create your plan in minutes, track progress, and stay motivated.</p>
        <RouterLink :to="isAuthed ? { name: 'plans' } : { name: 'register' }" class="btn btn-lg btn-dark">Get started</RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
// Vue
import { computed, reactive } from 'vue'
import { RouterLink } from 'vue-router'

// Auth store
import { useAuth } from '../stores/auth'

// Read auth state from your Pinia store
const auth = useAuth()
const isAuthed = computed(() => auth.isAuthenticated)
const isAdmin = computed(() => !!auth.user && auth.user.role === 'admin')

// Mock stats (replace with live data if needed)
const mock = reactive({
  streak: 3,
  community: 12,
  rating: 4.7,
  routes: 5
})
</script>

<style scoped>
/* Lightweight, clean styles */
.hero-card { min-height: 320px; }
.icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid rgba(0,0,0,.1);
  font-size: 1.1rem;
}
.icon-lg {
  width: 56px; height: 56px; border-radius: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid rgba(0,0,0,.1);
  font-size: 1.25rem;
}
.hover-card:hover { transform: translateY(-2px); transition: transform .15s ease; }
.stat-tile { background: #fff; }
.cta-band { background: linear-gradient(180deg, #fff, #f8f9fa); }
.logos img { filter: grayscale(1); opacity: .7; }
</style>
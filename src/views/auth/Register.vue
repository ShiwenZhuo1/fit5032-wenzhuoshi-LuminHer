<template>
  <section class="bg-light py-5">
    <div class="container">
      <div class="text-center mb-5">
        <h1 class="display-5 fw-bold">Create account</h1>
        <p class="lead text-secondary m-0">Join LuminHer and start your journey.</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-md-7 col-lg-5">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <!-- Error banner -->
              <div v-if="error" class="alert alert-danger">{{ error }}</div>

              <form @submit.prevent="onSubmit" novalidate>
                <!-- Name -->
                <div class="mb-3">
                  <label for="name" class="form-label">Name</label>
                  <input
                    id="name"
                    v-model.trim="name"
                    type="text"
                    class="form-control"
                    required
                    placeholder="Your name"
                    autocomplete="name"
                  />
                </div>

                <!-- Email -->
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    id="email"
                    v-model.trim="email"
                    type="email"
                    class="form-control"
                    required
                    placeholder="you@example.com"
                    autocomplete="email"
                  />
                </div>

                <!-- Password -->
                <div class="mb-3">
                  <label for="pwd" class="form-label">Password</label>
                  <input
                    id="pwd"
                    v-model="password"
                    type="password"
                    class="form-control"
                    minlength="6"
                    required
                    placeholder="••••••••"
                    autocomplete="new-password"
                  />
                </div>

                <!-- Confirm -->
                <div class="mb-3">
                  <label for="confirm" class="form-label">Confirm Password</label>
                  <input
                    id="confirm"
                    v-model="confirm"
                    type="password"
                    class="form-control"
                    minlength="6"
                    required
                    placeholder="Repeat password"
                    autocomplete="new-password"
                  />
                  <small v-if="confirm && confirm !== password" class="text-danger">
                    Passwords do not match.
                  </small>
                </div>

                <button type="submit" class="btn btn-dark w-100" :disabled="loading">
                  {{ loading ? 'Creating account…' : 'Create account' }}
                </button>
              </form>

              <p class="text-center small mt-3 mb-0">
                Already have an account?
                <RouterLink :to="{ name: 'login' }">Log in</RouterLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../../stores/auth'

const router = useRouter()
const auth = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')

const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''

  if (!name.value.trim()) {
    error.value = 'Name is required.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }

  try {
    loading.value = true
    await auth.register({ name: name.value, email: email.value, password: password.value })

    // Simple role routing by email suffix for demo
    const isAdmin = (email.value || '').endsWith('@admin.com')
    router.push({ name: isAdmin ? 'adminHome' : 'userHome' })
  } catch (e) {
    error.value = e?.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* keep default bootstrap look */
</style>
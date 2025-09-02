<template>
  <section class="bg-light py-5">
    <div class="container">
      <div class="text-center mb-5">
        <h1 class="display-5 fw-bold">Log in</h1>
        <p class="lead text-secondary m-0">Access your LuminHer account.</p>
      </div>

      <div class="row justify-content-center">
        <div class="col-12 col-md-7 col-lg-5">
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <div v-if="submitted && hasErrors" class="alert alert-danger">
                Please fix the errors below and try again.
              </div>

              <form @submit.prevent="onSubmit" novalidate>
                <!-- Email -->
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input id="email" v-model.trim="email" type="email"
                         class="form-control" :class="{'is-invalid': showEmailErr}"
                         placeholder="you@example.com" required />
                  <div class="invalid-feedback">Enter a valid email address.</div>
                </div>

                <!-- Password -->
                <div class="mb-3">
                  <label for="pwd" class="form-label">Password</label>
                  <input id="pwd" v-model="password" type="password"
                         class="form-control" :class="{'is-invalid': showPwdErr}"
                         placeholder="••••••••" minlength="6" required />
                  <div class="invalid-feedback">Password must be at least 6 characters.</div>
                </div>

                <button type="submit" class="btn btn-dark w-100">Log in</button>
              </form>

              <p class="text-center small mt-3 mb-0">
                Don’t have an account?
                <RouterLink to="/auth/register">Create one</RouterLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '../../stores/auth' // relative path; Pinia store

const email = ref('')
const password = ref('')
const submitted = ref(false)

const router = useRouter()
const auth = useAuth()

// same validation as register (email pattern + min length)
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const pwdValid   = computed(() => password.value.length >= 6)

const showEmailErr = computed(() => submitted.value && !emailValid.value)
const showPwdErr   = computed(() => submitted.value && !pwdValid.value)
const hasErrors    = computed(() => !emailValid.value || !pwdValid.value)

// submit: validate -> login via store -> route by role
function onSubmit() {
  submitted.value = true
  if (hasErrors.value) return

  // demo auth (replace with API later)
  auth.login({ email: email.value, name: 'Demo User' })

  if (auth.user.role === 'admin') {
    router.push({ name: 'adminHome' })
  } else {
    router.push({ name: 'userHome' })
  }
}
</script>
<!-- src/views/auth/Register.vue -->
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
              <div
                v-if="error"
                class="alert alert-danger"
                role="alert"
                aria-live="assertive"
              >
                {{ error }}
              </div>

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
                    @input="clearError"
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
                    @input="clearError"
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
                    required
                    placeholder="••••••••"
                    autocomplete="new-password"
                    @input="onPasswordInput"
                  />
                  <!-- Live validation -->
                  <ul class="list-unstyled small mt-2 mb-0">
                    <li :class="ruleClass(hasMinLen)">
                      <i class="pi" :class="hasMinLen ? 'pi-check-circle' : 'pi-circle'"></i>
                      At least 6 characters
                    </li>
                    <li :class="ruleClass(hasUpper)">
                      <i class="pi" :class="hasUpper ? 'pi-check-circle' : 'pi-circle'"></i>
                      One uppercase letter
                    </li>
                    <li :class="ruleClass(hasLower)">
                      <i class="pi" :class="hasLower ? 'pi-check-circle' : 'pi-circle'"></i>
                      One lowercase letter
                    </li>
                    <li :class="ruleClass(hasSpecial)">
                      <i class="pi" :class="hasSpecial ? 'pi-check-circle' : 'pi-circle'"></i>
                      One special symbol
                    </li>
                  </ul>
                </div>

                <!-- Confirm -->
                <div class="mb-3">
                  <label for="confirm" class="form-label">Confirm Password</label>
                  <input
                    id="confirm"
                    v-model="confirm"
                    type="password"
                    class="form-control"
                    required
                    placeholder="Repeat password"
                    autocomplete="new-password"
                    @input="clearError"
                  />
                  <small
                    v-if="confirm && confirm !== password"
                    class="text-danger"
                  >
                    Passwords do not match.
                  </small>
                </div>

                <button
                  type="submit"
                  class="btn btn-dark w-100"
                  :disabled="loading || !allRulesValid"
                >
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
import { ref, computed } from 'vue'
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

// Password validation
const hasMinLen = computed(() => password.value.length >= 6)
const hasUpper = computed(() => /[A-Z]/.test(password.value))
const hasLower = computed(() => /[a-z]/.test(password.value))
const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(password.value))
const allRulesValid = computed(
  () => hasMinLen.value && hasUpper.value && hasLower.value && hasSpecial.value
)

function ruleClass(ok) {
  return ok ? 'text-success' : 'text-muted'
}

function clearError() {
  if (error.value) error.value = ''
}

function onPasswordInput() {
  clearError()
}

function friendlyAuthError(e) {
  const code = e?.code || ''
  const map = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be stronger.',
    'auth/network-request-failed': 'Network error. Please try again.',
  }
  return map[code] || e?.message || 'Registration failed. Please try again.'
}

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
  if (!allRulesValid.value) {
    error.value = 'Password does not meet the requirements.'
    return
  }

  try {
    loading.value = true
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })
    const isAdmin = (email.value || '').endsWith('@admin.com')
    router.push({ name: isAdmin ? 'adminHome' : 'userHome' })
  } catch (e) {
    error.value = friendlyAuthError(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
ul li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.text-success i {
  color: #198754;
}
.text-muted i {
  color: #ccc;
}
</style>
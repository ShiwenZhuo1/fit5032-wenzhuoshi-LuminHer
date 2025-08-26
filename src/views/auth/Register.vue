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
              <!-- Global alert (after submit only) -->
              <div v-if="submitted && hasErrors" class="alert alert-danger">
                Please fix the errors below and try again.
              </div>

              <form @submit.prevent="onSubmit" novalidate>
                <!-- Name -->
                <div class="mb-3">
                  <label for="name" class="form-label">Name</label>
                  <input
                    id="name"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': !!errors.name }"
                    v-model.trim="form.name"
                    @input="onNameInput"
                    @blur="validateName(true)"
                    placeholder="Your name"
                  />
                  <div v-if="errors.name" class="invalid-feedback d-block">{{ errors.name }}</div>
                </div>

                <!-- Email -->
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': !!errors.email }"
                    v-model.trim="form.email"
                    @input="onEmailInput"
                    @blur="validateEmail(true)"
                    placeholder="you@example.com"
                  />
                  <div v-if="errors.email" class="invalid-feedback d-block">{{ errors.email }}</div>
                </div>

                <!-- Password -->
                <div class="mb-3">
                  <label for="pwd" class="form-label">Password</label>
                  <input
                    id="pwd"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': !!errors.password }"
                    v-model="form.password"
                    @input="onPwdInput"
                    @blur="validatePassword(true)"
                    placeholder="••••••••"
                  />

                  <!-- Dynamic next-hint + strength (only after first touch or submit) -->
                  <small
                    v-if="touched.password || submitted"
                    class="form-text"
                    :class="passwordOk ? 'text-success' : 'text-muted'"
                  >
                    {{ nextPwdHint }}
                  </small>

                  <div v-if="touched.password || submitted" class="progress mt-2" style="height:6px" aria-hidden="true">
                    <div class="progress-bar"
                         role="progressbar"
                         :style="{ width: strengthPercent + '%' }"
                         :class="strengthClass"
                         :aria-valuenow="strengthPercent" aria-valuemin="0" aria-valuemax="100" />
                  </div>

                  <div v-if="errors.password" class="invalid-feedback d-block">{{ errors.password }}</div>
                </div>

                <!-- Confirm Password -->
                <div class="mb-3">
                  <label for="pwd2" class="form-label">Confirm Password</label>
                  <input
                    id="pwd2"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': !!errors.confirm }"
                    v-model="form.confirm"
                    @input="onConfirmInput"
                    @blur="validateConfirm(true)"
                    placeholder="Repeat password"
                  />
                  <small v-if="touched.confirm || submitted"
                         :class="confirmOk ? 'text-success' : 'text-danger'">
                    {{ confirmOk ? 'Passwords match.' : 'Passwords do not match.' }}
                  </small>
                </div>

                <button type="submit" class="btn btn-dark w-100 mb-2">Create account</button>
                <button type="button" class="btn btn-secondary w-100" @click="clearForm">Clear form</button>
              </form>

              <p class="text-center small mt-3 mb-0">
                Already have an account? <RouterLink to="/auth/login">Log in</RouterLink>
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
import { RouterLink } from 'vue-router'

/* ---------- state ---------- */
const form = ref({
  name: '',
  email: '',
  password: '',
  confirm: '',
})

const errors = ref({
  name: null,
  email: null,
  password: null,
  confirm: null,
})

const touched = ref({
  name: false,
  email: false,
  password: false,
  confirm: false,
})

const submitted = ref(false)

/* ---------- helpers ---------- */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const upperRe = /[A-Z]/
const lowerRe = /[a-z]/
const numRe   = /\d/
const specRe  = /[\W_]/
const PWD_MIN = 6

/* password checks (computed so UI auto-updates) */
const pwdChecks = computed(() => ({
  len: (form.value.password || '').length >= PWD_MIN,
  up : upperRe.test(form.value.password || ''),
  lo : lowerRe.test(form.value.password || ''),
  num: numRe.test(form.value.password || ''),
  sp : specRe.test(form.value.password || ''),
}))
const passwordOk = computed(() => Object.values(pwdChecks.value).every(Boolean))
const unmetList = computed(() => {
  const list = []
  if (!pwdChecks.value.len) list.push(`Add at least ${PWD_MIN} characters`)
  if (!pwdChecks.value.up)  list.push('Include an uppercase letter')
  if (!pwdChecks.value.lo)  list.push('Include a lowercase letter')
  if (!pwdChecks.value.num) list.push('Include a number')
  if (!pwdChecks.value.sp)  list.push('Include a special character')
  return list
})
const nextPwdHint = computed(() => (passwordOk.value ? 'Strong password ✓' : unmetList.value[0] ?? ''))

/* strength bar */
const passedCount = computed(() => Object.values(pwdChecks.value).filter(Boolean).length)
const strengthPercent = computed(() => (passedCount.value / 5) * 100)
const strengthClass = computed(() => {
  if (strengthPercent.value >= 80) return 'bg-success'
  if (strengthPercent.value >= 60) return 'bg-info'
  if (strengthPercent.value >= 40) return 'bg-warning'
  return 'bg-danger'
})

/* confirm */
const confirmOk = computed(() =>
  form.value.confirm.length > 0 && form.value.confirm === form.value.password
)

/* ---------- validators ---------- */
/* name */
function validateName(strict = false) {
  const v = (form.value.name || '').trim()
  const ok = v.length >= 2
  if (ok) errors.value.name = null
  else if (strict || submitted.value) errors.value.name = 'Name must be at least 2 characters.'
}

/* email */
function validateEmail(strict = false) {
  const v = (form.value.email || '').trim()
  const ok = emailRe.test(v)
  if (ok) errors.value.email = null
  else if (strict || submitted.value) errors.value.email = 'Enter a valid email address.'
}

/* password */
function validatePassword(strict = false) {
  if (passwordOk.value) {
    errors.value.password = null
  } else if (strict || submitted.value) {
    // show the first unmet rule as the message
    errors.value.password = unmetList.value[0] ||
      'Password must meet the requirements.'
  }
}

/* confirm password */
function validateConfirm(strict = false) {
  if (confirmOk.value) {
    errors.value.confirm = null
  } else if (strict || submitted.value) {
    errors.value.confirm = 'Passwords do not match.'
  }
}

/* ---------- input handlers (mark touched; no errors on typing) ---------- */
function onNameInput()     { touched.value.name = true; }
function onEmailInput()    { touched.value.email = true; }
function onPwdInput()      { touched.value.password = true; }
function onConfirmInput()  { touched.value.confirm = true; }

/* overall error flag */
const hasErrors = computed(() =>
  !!errors.value.name || !!errors.value.email || !!errors.value.password || !!errors.value.confirm
)

/* submit */
function onSubmit() {
  submitted.value = true
  validateName(true)
  validateEmail(true)
  validatePassword(true)
  validateConfirm(true)
  if (hasErrors.value) return
  alert('Registration form valid (demo).')
}

/* clear */
function clearForm() {
  form.value = { name: '', email: '', password: '', confirm: '' }
  errors.value = { name: null, email: null, password: null, confirm: null }
  touched.value = { name: false, email: false, password: false, confirm: false }
  submitted.value = false
}
</script>

<style scoped>
.progress-bar { transition: width .2s ease; }
</style>
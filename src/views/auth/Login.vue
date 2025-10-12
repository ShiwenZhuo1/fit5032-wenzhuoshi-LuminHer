<!-- src/views/auth/Login.vue -->
<template>
  <section class="container py-5" style="max-width:400px">
    <h2 class="mb-4">Login</h2>

    <div
      v-if="error"
      class="alert alert-danger"
      role="alert"
      aria-live="assertive"
    >
      {{ error }}
    </div>

    <form @submit.prevent="onLogin" novalidate>
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="form-control"
          required
          autocomplete="email"
          @input="clearError"
        />
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="form-control"
          required
          autocomplete="current-password"
          @input="clearError"
        />
        <small v-if="error" class="text-danger">{{ error }}</small>
      </div>

      <button class="btn btn-primary w-100" type="submit" :disabled="loading">
        {{ loading ? 'Logging in…' : 'Log in' }}
      </button>

      <div class="text-center mt-3">
        <button class="btn btn-link p-0" type="button" @click="resetPassword">
          Forgot password?
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuth } from "../../stores/auth"
import { getAuth, sendPasswordResetEmail } from "firebase/auth"

const router = useRouter()
const authStore = useAuth()
const auth = getAuth()

const email = ref("")
const password = ref("")
const error = ref("")
const loading = ref(false)

function friendlyAuthError(e) {
  const code = e?.code || ""
  const map = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account found with this email.",
    "auth/too-many-requests":
      "Too many attempts. Please try again later or reset your password.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/invalid-email": "Please enter a valid email address.",
  }
  return map[code] || e?.message || "Login failed. Please try again."
}

function clearError() {
  if (error.value) error.value = ""
}

async function onLogin() {
  error.value = ""
  loading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push({ name: "userHome" }) 
  } catch (err) {
    error.value = friendlyAuthError(err)
  } finally {
    loading.value = false
  }
}

async function resetPassword() {
  if (!email.value) {
    alert("Please enter your email first.")
    return
  }
  try {
    await sendPasswordResetEmail(auth, email.value)
    alert("Password reset email sent! Please check your inbox.")
  } catch (err) {
    alert("Error: " + (friendlyAuthError(err) || err.message))
  }
}
</script>
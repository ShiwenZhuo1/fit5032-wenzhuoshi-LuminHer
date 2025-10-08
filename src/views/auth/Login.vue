<template>
  <section class="container py-5" style="max-width:400px">
    <h2 class="mb-4">Login</h2>

    <form @submit.prevent="onLogin">
      <div class="mb-3">
        <label>Email</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>

      <div class="mb-3">
        <label>Password</label>
        <input v-model="password" type="password" class="form-control" required />
      </div>

      <button class="btn btn-primary w-100" type="submit">Log in</button>

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
import { getAuth, sendPasswordResetEmail } from "firebase/auth"  // ✅ 必须导入这里！

const router = useRouter()
const authStore = useAuth()
const auth = getAuth()

const email = ref("")
const password = ref("")
const error = ref("")

async function onLogin() {
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push({ name: "userHome" })
  } catch (err) {
    error.value = err.message
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
    alert("Error: " + err.message)
  }
}
</script>
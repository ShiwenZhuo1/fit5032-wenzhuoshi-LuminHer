<template>
  <div class="container my-4" v-if="isAuthed">
    <h2 class="fw-bold mb-3">Account</h2>

    <!-- Basic info card -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Email (sign-in)</label>
            <input class="form-control" :value="userEmail" disabled />
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label">Display name</label>
            <input class="form-control" v-model.trim="profile.name" placeholder="Your name" />
            <div class="form-text">Shown in community etc.</div>
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label">Timezone</label>
            <input class="form-control" v-model.trim="profile.timezone" />
            <div class="form-text">Default: detected from your browser.</div>
          </div>

          <div class="col-12 col-md-6">
            <label class="form-label">Units</label>
            <select class="form-select" v-model="profile.units">
              <option value="metric">Metric (cm / kg)</option>
              <option value="imperial">Imperial (ft/in / lb)</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label">Bio / notes</label>
            <textarea class="form-control" rows="3" v-model.trim="profile.bio" placeholder="Tell us a bit about yourself" />
          </div>
        </div>

        <div class="mt-4 d-flex gap-2">
          <button class="btn btn-dark" :disabled="saving" @click="saveProfile">
            <span v-if="!saving">Save profile</span>
            <span v-else>Saving…</span>
          </button>
          <button class="btn btn-outline-secondary" @click="resetLocal">Reset</button>
        </div>
      </div>
    </div>

    <!-- Password card -->
    <div class="card shadow-sm border-0">
      <div class="card-body">
        <h5 class="fw-bold mb-3">Password</h5>

        <div class="mb-3">
          <button class="btn btn-outline-primary" @click="sendResetEmail" :disabled="sendingEmail">
            <span v-if="!sendingEmail">Send password reset email</span>
            <span v-else>Sending…</span>
          </button>
          <div class="form-text">
            Recommended. We’ll email a secure link to <strong>{{ userEmail }}</strong>.
          </div>
        </div>

        <details class="mt-3">
          <summary class="mb-3">Or change password here (requires current password)</summary>

          <div class="row g-3">
            <div class="col-12 col-md-4">
              <label class="form-label">Current password</label>
              <input :type="showPw ? 'text':'password'" class="form-control" v-model="pw.current" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">New password</label>
              <input :type="showPw ? 'text':'password'" class="form-control" v-model="pw.next" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label">Confirm new password</label>
              <input :type="showPw ? 'text':'password'" class="form-control" v-model="pw.confirm" />
            </div>
            <div class="col-12 d-flex align-items-center gap-2">
              <input id="showPw" type="checkbox" class="form-check-input" v-model="showPw" />
              <label class="form-check-label" for="showPw">Show passwords</label>
            </div>
          </div>

          <div class="mt-3">
            <button class="btn btn-primary" :disabled="changingPw" @click="changePasswordDirect">
              <span v-if="!changingPw">Change password</span>
              <span v-else>Updating…</span>
            </button>
          </div>
        </details>
      </div>
    </div>
  </div>

  <!-- Not signed in -->
  <div class="container my-5 text-center" v-else>
    <h4 class="mb-3">Please log in to manage your account.</h4>
    <RouterLink class="btn btn-dark" :to="{ name: 'login' }">Log in</RouterLink>
  </div>
</template>

<script setup>
// Vue & router
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

// Auth store (your existing Pinia store)
import { useAuth } from '../stores/auth'

// Firebase Auth (modular v9)
import {
  getAuth,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'

/* ---------- Auth state ---------- */
const authStore = useAuth()
const isAuthed = computed(() => authStore?.isAuthenticated)
const user = computed(() => authStore?.user || getAuth().currentUser)
const userEmail = computed(() => user.value?.email || '')

/* ---------- Profile (stored locally + displayName synced to Firebase) ---------- */
const PROFILE_KEY = 'luminher_profile'

const profile = ref({
  name: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  units: 'metric',
  bio: '',
})

/** Load from localStorage & hydrate from auth */
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    profile.value = {
      name: saved.name ?? (user.value?.displayName || ''),
      timezone: saved.timezone ?? profile.value.timezone,
      units: saved.units ?? 'metric',
      bio: saved.bio ?? '',
    }
  } catch {
    // ignore parse error and keep defaults
  }
}

const saving = ref(false)
async function saveProfile() {
  saving.value = true
  try {
    // Persist locally (simple & fast)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value))

    // Also sync displayName to Firebase profile
    if (user.value && profile.value.name && user.value.displayName !== profile.value.name) {
      await updateProfile(user.value, { displayName: profile.value.name })
      // optional: reflect into your Pinia store if it mirrors displayName
      if (authStore && typeof authStore.refresh === 'function') {
        await authStore.refresh() // if you have such a method
      }
    }

    alert('✅ Profile saved.')
  } catch (e) {
    console.error('saveProfile error', e)
    alert('❌ Failed to save profile.')
  } finally {
    saving.value = false
  }
}

function resetLocal() {
  localStorage.removeItem(PROFILE_KEY)
  loadProfile()
}

/* ---------- Password: via reset email ---------- */
const sendingEmail = ref(false)
async function sendResetEmail() {
  if (!userEmail.value) return alert('No email found on the account.')
  sendingEmail.value = true
  try {
    await sendPasswordResetEmail(getAuth(), userEmail.value)
    alert('📮 Password reset email sent. Please check your inbox.')
  } catch (e) {
    console.error('sendResetEmail error', e)
    alert('❌ Could not send the email. Check your auth config or try again.')
  } finally {
    sendingEmail.value = false
  }
}

/* ---------- Password: direct change with reauth ---------- */
const pw = ref({ current: '', next: '', confirm: '' })
const showPw = ref(false)
const changingPw = ref(false)

/**
 * Change password directly:
 * - Re-authenticate with current password
 * - Update to new password
 * Firebase may require "recent login" – this reauth step handles it.
 */
async function changePasswordDirect() {
  if (!user.value) return alert('Please log in first.')
  if (!pw.value.current || !pw.value.next || !pw.value.confirm) {
    return alert('Please fill all password fields.')
  }
  if (pw.value.next !== pw.value.confirm) {
    return alert('New passwords do not match.')
  }
  if (pw.value.next.length < 6) {
    return alert('New password must be at least 6 characters.')
  }

  changingPw.value = true
  try {
    const cred = EmailAuthProvider.credential(userEmail.value, pw.value.current)
    await reauthenticateWithCredential(user.value, cred)
    await updatePassword(user.value, pw.value.next)
    alert('✅ Password updated.')
    pw.value = { current: '', next: '', confirm: '' }
  } catch (e) {
    console.error('changePasswordDirect error', e)
    // Common errors: auth/wrong-password, auth/too-many-requests, auth/requires-recent-login
    alert('❌ Failed to update password. Please verify the current password or try the email method.')
  } finally {
    changingPw.value = false
  }
}

/* ---------- Init ---------- */
onMounted(() => {
  loadProfile()
})
</script>
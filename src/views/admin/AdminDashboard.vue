<!-- src/views/admin/AdminDashboard.vue -->
<template>
  <section class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0 fw-bold">Admin Dashboard</h2>
      <div class="text-muted small">Signed in as: {{ auth.user?.email }}</div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <h5 class="fw-bold mb-3">Users</h5>

        <!-- create user -->
        <div class="d-flex gap-2 mb-3">
          <input class="form-control" v-model.trim="form.displayName" placeholder="Name" style="max-width:200px" />
          <input class="form-control" v-model.trim="form.email" type="email" placeholder="Email" style="max-width:240px" />
          <input class="form-control" v-model="form.password" type="password" placeholder="Password (≥6)" style="max-width:180px" />
          <div class="form-check d-flex align-items-center">
            <input id="isAdmin" class="form-check-input me-1" type="checkbox" v-model="form.admin" />
            <label for="isAdmin" class="form-check-label">Admin</label>
          </div>
          <button class="btn btn-dark" @click="onCreate" :disabled="creating">Add</button>

          <button class="btn btn-outline-secondary ms-auto" @click="refreshAdmin" :disabled="refreshing">
            Refresh admin role
          </button>
        </div>

        <!-- table -->
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Name</th>
                <th>Admin</th>
                <th>Created</th>
                <th>Last sign-in</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, i) in users" :key="u.uid">
                <td>{{ i + 1 }}</td>
                <td><code>{{ u.email }}</code></td>
                <td>{{ u.displayName || '—' }}</td>
                <td>
                  <span class="badge" :class="u.admin ? 'text-bg-dark' : 'text-bg-secondary'">
                    {{ u.admin ? 'admin' : 'user' }}
                  </span>
                </td>
                <td>{{ fmt(u.createdAt) }}</td>
                <td>{{ fmt(u.lastSignIn) }}</td>
                <td class="text-center">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" @click="toggleAdmin(u)">{{ u.admin ? 'Revoke' : 'Grant' }}</button>
                    <button class="btn btn-outline-secondary" @click="resetPwd(u.email)">Reset</button>
                    <button class="btn btn-outline-danger" @click="remove(u.uid)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!users.length">
                <td colspan="7" class="text-center text-muted">No users.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- paging -->
        <div class="d-flex justify-content-between">
          <button class="btn btn-outline-secondary btn-sm" :disabled="!prevTokens.length" @click="prevPage">Prev</button>
          <button class="btn btn-outline-secondary btn-sm" :disabled="!nextPageToken" @click="nextPage">Next</button>
        </div>

        <p v-if="err" class="text-danger small mt-3 mb-0">{{ err }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../stores/auth'
import {
  ensureAdminClaim, listUsers, createUser, deleteUser, setUserRole, generateResetLink
} from '../../lib/fxAdmin'

const auth = useAuth()
const router = useRouter()

// redirect if not signed in
if (!auth.isAuthenticated) router.replace({ name: 'login' })

const users = ref([])
const nextPageToken = ref(null)
const prevTokens = ref([])            // tokens stack to go back
const currentToken = ref(null)        // token used for the current page
const err = ref('')

const form = ref({ displayName: '', email: '', password: '', admin: false })
const creating = ref(false)
const refreshing = ref(false)

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

async function load(pageToken) {
  err.value = ''
  try {
    const res = await listUsers(pageToken, 20)
    users.value = res.users
    nextPageToken.value = res.nextPageToken
    currentToken.value = pageToken || null
  } catch (e) {
    const msg = e?.message || ''
    if (msg.includes('permission-denied')) err.value = 'Admin only.'
    else if (msg.includes('unauthenticated')) err.value = 'Please sign in.'
    else err.value = msg || 'Failed to load users'
  }
}

async function onCreate() {
  err.value = ''
  try {
    creating.value = true
    await createUser({
      email: form.value.email,
      password: form.value.password,
      displayName: form.value.displayName,
      admin: form.value.admin,
    })
    form.value = { displayName: '', email: '', password: '', admin: false }
    await load(currentToken.value)
  } catch (e) {
    err.value = e?.message || 'Failed to create user'
  } finally {
    creating.value = false
  }
}

async function toggleAdmin(u) {
  err.value = ''
  try {
    await setUserRole(u.uid, !u.admin)
    await load(currentToken.value)
  } catch (e) {
    err.value = e?.message || 'Failed to update role'
  }
}

async function remove(uid) {
  if (!confirm('Delete this user?')) return
  err.value = ''
  try {
    await deleteUser(uid)
    await load(currentToken.value)
  } catch (e) {
    err.value = e?.message || 'Failed to delete'
  }
}

async function resetPwd(email) {
  err.value = ''
  try {
    const { link } = await generateResetLink(email)
    alert(`Reset link generated:\n\n${link}\n\nYou can email this link to the user.`)
  } catch (e) {
    err.value = e?.message || 'Failed to generate reset link'
  }
}

// paging
async function nextPage() {
  if (!nextPageToken.value) return
  prevTokens.value.push(currentToken.value) // remember current to go back
  await load(nextPageToken.value)
}
async function prevPage() {
  if (!prevTokens.value.length) return
  const token = prevTokens.value.pop()
  await load(token || undefined)
}

// manual refresh helper
async function refreshAdmin() {
  refreshing.value = true
  try {
    await ensureAdminClaim()
    if (auth.user) await auth.user.getIdToken(true)
    await load(currentToken.value)
  } finally {
    refreshing.value = false
  }
}

// first mount: attempt to grant admin by policy, refresh token, then load
onMounted(async () => {
  try {
    await ensureAdminClaim()
    if (auth.user) await auth.user.getIdToken(true)
  } catch (e) {
    // ignore; user may already have the claim or not match policy
  }

  // soft guard on client side
  if (!auth.user?.email?.endsWith('@admin.com')) {
    router.replace({ name: 'userHome' })
    return
  }

  await load()
})
</script>

<style scoped>
/* keep defaults */
</style>
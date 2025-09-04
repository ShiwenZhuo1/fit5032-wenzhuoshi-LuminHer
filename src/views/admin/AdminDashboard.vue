<template>
  <section class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0">Admin Dashboard</h2>
      <span class="text-muted small">Signed in as: {{ auth.user?.email }}</span>
    </div>

    <!-- simple top tabs -->
    <ul class="nav nav-pills gap-2 mb-3">
      <li class="nav-item">
        <button class="btn" :class="tab==='overview'?'btn-dark':'btn-outline-dark'" @click="tab='overview'">
          Overview
        </button>
      </li>
      <li class="nav-item">
        <button class="btn" :class="tab==='users'?'btn-dark':'btn-outline-dark'" @click="tab='users'">
          Manage Users
        </button>
      </li>
    </ul>

    <div v-if="tab==='overview'">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">System overview</h5>
          <p class="mb-0 text-muted">This is a demo admin area. Add charts and stats here later.</p>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-3">User Management</h5>
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(u, i) in users" :key="u.email">
                  <td>{{ i+1 }}</td>
                  <td>{{ u.name }}</td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span class="badge" :class="u.role==='admin' ? 'bg-dark' : 'bg-secondary'">{{ u.role }}</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger" @click="remove(i)">Remove</button>
                  </td>
                </tr>
                <tr v-if="!users.length">
                  <td colspan="5" class="text-center text-muted">No users yet (demo data).</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- demo add form -->
          <form class="row gy-2 gx-2 mt-2" @submit.prevent="addUser">
            <div class="col-12 col-md-3">
              <input class="form-control" v-model.trim="draft.name" placeholder="Name" required />
            </div>
            <div class="col-12 col-md-4">
              <input class="form-control" v-model.trim="draft.email" placeholder="Email" required />
            </div>
            <div class="col-12 col-md-3">
              <select class="form-select" v-model="draft.role" required>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div class="col-12 col-md-2">
              <button class="btn btn-primary w-100" type="submit">Add</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../../stores/auth'
const auth = useAuth()

const tab = ref('overview')

// demo users list
const users = ref([
  { name: 'Alice', email: 'alice@example.com', role: 'user' },
  { name: 'Bob',   email: 'bob@admin.com',     role: 'admin' }
])

const draft = ref({ name: '', email: '', role: 'user' })

function addUser() {
  if (!draft.value.name || !draft.value.email) return
  users.value.push({ ...draft.value })
  draft.value = { name: '', email: '', role: 'user' }
}
function remove(i) { users.value.splice(i, 1) }
</script>
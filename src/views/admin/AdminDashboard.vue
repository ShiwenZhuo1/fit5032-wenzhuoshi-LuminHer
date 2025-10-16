<!-- src/views/admin/AdminDashboard.vue -->
<template>
  <section class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0 fw-bold">Admin Dashboard</h2>
      <div class="text-muted small">Signed in as: {{ auth.user?.email }}</div>
    </div>

    <!-- Overview -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="fw-bold m-0">Site Overview</h5>
          <button class="btn btn-outline-secondary btn-sm" @click="loadOverview" :disabled="ov.loading">
            {{ ov.loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div class="row g-3">
          <div class="col-6 col-lg-3">
            <div class="border rounded-3 p-3 h-100">
              <div class="text-secondary small">Total users</div>
              <div class="fs-3 fw-bold">{{ ov.metrics?.users_total ?? '—' }}</div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="border rounded-3 p-3 h-100">
              <div class="text-secondary small">Admins</div>
              <div class="fs-3 fw-bold">{{ ov.metrics?.admins_total ?? '—' }}</div>
            </div>
          </div>
          <div class="col-12 col-lg-6">
            <div class="border rounded-3 p-3 h-100">
              <div class="text-secondary small">API health</div>
              <div class="d-flex flex-wrap gap-3">
                <span class="badge" :class="ov.health?.ok ? 'text-bg-success' : 'text-bg-danger'">
                  {{ ov.health?.ok ? 'OK' : 'Down' }}
                </span>
                <span class="text-muted small">
                  {{ ov.health?.service }} • {{ ov.health?.region }}
                </span>
              </div>
              <div class="text-muted small mt-1">
                Updated: {{ ov.metrics?.ts ? new Date(ov.metrics.ts).toLocaleString() : '—' }}
              </div>
            </div>
          </div>
        </div>

        <p v-if="ov.err" class="text-danger small mt-3 mb-0">{{ ov.err }}</p>
      </div>
    </div>

    <!-- Daily signups chart -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h5 class="fw-bold m-0">User Signups (Last 30 Days)</h5>
          <button class="btn btn-outline-secondary btn-sm" @click="loadDailySignups" :disabled="chartLoading">
            {{ chartLoading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>

        <div class="position-relative" style="min-height:240px;">
          <canvas ref="canvasEl" height="120" />
          <div v-if="chartErr" class="text-danger small mt-2">{{ chartErr }}</div>
        </div>
      </div>
    </div>

    <!-- Users management -->
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

        <!-- 搜索区（全局 + 按列） -->
        <div class="d-flex flex-wrap gap-2 mb-3">
          <!-- 全局搜索 -->
          <span class="position-relative" style="max-width:280px">
            <i class="pi pi-search position-absolute" style="left:10px; top:10px;"></i>
            <InputText v-model="globalFilter" placeholder="Search all columns" class="form-control ps-5" />
          </span>

          <!-- 按列过滤 -->
          <InputText v-model="colFilters.email.value"       placeholder="Filter: Email"       class="form-control" />
          <InputText v-model="colFilters.displayName.value" placeholder="Filter: Name"        class="form-control" />
          <InputText v-model="colFilters.role.value"        placeholder="Filter: Role"        class="form-control" />
        </div>

        <!-- DataTable（分页10行、排序、搜索、按列过滤、条纹行） -->
        <div class="d-flex justify-content-end mb-2">
          <button class="btn btn-outline-secondary btn-sm" @click="exportUsersCsv">Export CSV</button>
        </div>

        <DataTable
          :value="users"
          dataKey="uid"
          :paginator="true"
          :rows="10"
          :rowsPerPageOptions="[10,20,50]"
          stripedRows
          responsiveLayout="scroll"
          :globalFilterFields="['email','displayName','role']"
          :filters="primeFilters"
        >
          <Column field="email" header="Email" sortable />
          <Column field="displayName" header="Name" sortable />
          <Column header="Admin" field="role" sortable>
            <template #body="{ data }">
              <span class="badge" :class="data.admin ? 'text-bg-dark' : 'text-bg-secondary'">
                {{ data.admin ? 'admin' : 'user' }}
              </span>
            </template>
          </Column>
          <Column field="createdAt" header="Created" sortable>
            <template #body="{ data }">{{ fmt(data.createdAt) }}</template>
          </Column>
          <Column field="lastSignIn" header="Last sign-in" sortable>
            <template #body="{ data }">{{ fmt(data.lastSignIn) }}</template>
          </Column>
          <Column header="Actions" style="width:220px" class="text-center">
            <template #body="{ data }">
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" @click="toggleAdmin(data)">{{ data.admin ? 'Revoke' : 'Grant' }}</button>
                <button class="btn btn-outline-secondary" @click="resetPwd(data.email)">Reset</button>
                <button class="btn btn-outline-danger" @click="remove(data.uid)">Delete</button>
              </div>
            </template>
          </Column>
        </DataTable>

        <p v-if="err" class="text-danger small mt-3 mb-0">{{ err }}</p>
      </div>
    </div>

    <!-- Admin email (SendGrid) -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <h5 class="fw-bold mb-3">Send Email</h5>

        <div class="row g-3 align-items-start">
          <div class="col-12 col-lg-4">
            <label class="form-label">Recipients (select users)</label>
            <div class="border rounded p-2" style="max-height:220px; overflow:auto;">
              <div v-for="u in users" :key="u.uid" class="form-check">
                <input class="form-check-input" type="checkbox" :id="`rcp-${u.uid}`" :value="u.uid" v-model="mailForm.uids" />
                <label class="form-check-label" :for="`rcp-${u.uid}`">{{ u.email || u.displayName || u.uid }}</label>
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-8">
            <div class="mb-2 d-flex gap-2">
              <input class="form-control" v-model.trim="mailForm.from" placeholder="From (verified sender)" />
              <input class="form-control" v-model.trim="mailForm.subject" placeholder="Subject" />
            </div>
            <div class="mb-2">
              <textarea class="form-control" rows="6" v-model="mailForm.html" placeholder="HTML content (or use Text)"></textarea>
            </div>
            <div class="mb-2">
              <textarea class="form-control" rows="4" v-model="mailForm.text" placeholder="Plain text content (optional)"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Attachments</label>
              <input class="form-control" type="file" multiple @change="onPickFiles" />
              <div class="text-muted small mt-1" v-if="mailForm.attachments.length">
                {{ mailForm.attachments.length }} file(s) ready
              </div>
            </div>
            <button class="btn btn-primary" :disabled="sendingMail" @click="onSendMail">
              {{ sendingMail ? 'Sending...' : 'Send Email' }}
            </button>
            <span v-if="mailErr" class="text-danger small ms-2">{{ mailErr }}</span>
            <span v-if="mailOk" class="text-success small ms-2">{{ mailOk }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Vue
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../stores/auth'

// PrimeVue DataTable pieces
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

// Admin SDK-backed helpers you already have
import {
  ensureAdminClaim, listUsers, createUser, deleteUser, setUserRole, generateResetLink
} from '../../lib/fxAdmin'

// New admin API (functions) helpers
import { fetchMetrics, fetchHealth, fetchDailySignups, sendAdminEmailWithAttachments } from '../../lib/adminApi'

// Chart.js
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
} from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const auth = useAuth()
const router = useRouter()

// redirect if not signed in
if (!auth.isAuthenticated) router.replace({ name: 'login' })

/* ---------- Overview ---------- */
const ov = ref({ loading: false, metrics: null, health: null, err: '' })

async function loadOverview() {
  ov.value.loading = true
  ov.value.err = ''
  try {
    const [m, h] = await Promise.all([fetchMetrics(), fetchHealth()])
    ov.value.metrics = m
    ov.value.health = h
  } catch (e) {
    ov.value.err = e?.message || 'Failed to load overview'
  } finally {
    ov.value.loading = false
  }
}

/* ---------- Daily Signups Chart ---------- */
const canvasEl = ref(null)
let chartInstance = null
const chartLoading = ref(false)
const chartErr = ref('')

function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
}

async function loadDailySignups() {
  chartLoading.value = true
  chartErr.value = ''
  try {
    const data = await fetchDailySignups()
    const labels = data.series.map(i => i.date)            // YYYY-MM-DD (UTC)
    const values = data.series.map(i => i.count)

    destroyChart()
    chartInstance = new Chart(canvasEl.value.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'New users / day',
          data: values,
          tension: 0.25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
          y: { beginAtZero: true, precision: 0 }
        }
      }
    })
  } catch (e) {
    chartErr.value = e?.message || 'Failed to load chart'
  } finally {
    chartLoading.value = false
  }
}

/* ---------- Users table (DataTable) ---------- */
const users = ref([])
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
    // 后端仍然按你的 callable 分页返回；前端 DataTable 做客户端分页（默认 10 行）
    const res = await listUsers(pageToken, 1000) // 取多一点方便客户端分页/搜索
    // 增加 role 字段，便于 DataTable 的文本搜索/过滤
    users.value = (res.users || []).map(u => ({ ...u, role: u.admin ? 'admin' : 'user' }))
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
    await load()
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
    await load()
  } catch (e) {
    err.value = e?.message || 'Failed to update role'
  }
}

async function remove(uid) {
  if (!confirm('Delete this user?')) return
  err.value = ''
  try {
    await deleteUser(uid)
    await load()
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

/* ---------- Export CSV (users) ---------- */
function exportUsersCsv() {
  const filtered = users.value.filter(u => matchFilters(u))
  const csv = toCsv(filtered, ['uid','email','displayName','admin','createdAt','lastSignIn'])
  downloadText(csv, 'users.csv', 'text/csv;charset=utf-8;')
}

function matchFilters(u) {
  const g = (globalFilter.value || '').toLowerCase()
  const okGlobal = !g || ['email','displayName','role'].some(f => String(u[f] || '').toLowerCase().includes(g))
  const f1 = (colFilters.value.email.value || '')
  const f2 = (colFilters.value.displayName.value || '')
  const f3 = (colFilters.value.role.value || '')
  const ok1 = !f1 || String(u.email || '').includes(f1)
  const ok2 = !f2 || String(u.displayName || '').includes(f2)
  const ok3 = !f3 || String(u.role || '').includes(f3)
  return okGlobal && ok1 && ok2 && ok3
}

function toCsv(items, headers) {
  const lines = []
  lines.push(headers.join(','))
  for (const it of items) {
    lines.push(headers.map(h => escapeCsv(it[h])).join(','))
  }
  return lines.join('\n')
}
function escapeCsv(v) {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}
function downloadText(text, filename, type) {
  const blob = new Blob([text], { type: type || 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* ---------- Admin Email ---------- */
const mailForm = ref({ uids: [], from: '', subject: '', html: '', text: '', attachments: [] })
const sendingMail = ref(false)
const mailErr = ref('')
const mailOk = ref('')

async function onSendMail() {
  mailErr.value = ''
  mailOk.value = ''
  try {
    if (!mailForm.value.uids.length) throw new Error('请选择至少一个收件人')
    if (!mailForm.value.subject) throw new Error('请输入邮件主题')
    if (!mailForm.value.html && !mailForm.value.text) throw new Error('请输入邮件内容（HTML 或 Text）')
    sendingMail.value = true
    const res = await sendAdminEmailWithAttachments({
      uids: mailForm.value.uids,
      subject: mailForm.value.subject,
      html: mailForm.value.html,
      text: mailForm.value.text,
      from: mailForm.value.from || undefined,
      attachments: mailForm.value.attachments,
    })
    mailOk.value = `Sent to ${res.sent} recipients.`
    // optionally clear
    // mailForm.value = { uids: [], from: '', subject: '', html: '', text: '' }
  } catch (e) {
    mailErr.value = e?.message || 'Failed to send email'
  } finally {
    sendingMail.value = false
  }
}

function onPickFiles(evt) {
  const files = Array.from(evt?.target?.files || [])
  if (!files.length) { mailForm.value.attachments = []; return }
  Promise.all(files.map(fileToBase64Attachment)).then(arr => {
    mailForm.value.attachments = arr
  }).catch(() => {
    mailForm.value.attachments = []
  })
}

function fileToBase64Attachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result || '').toString().split(',')[1] || ''
      resolve({ filename: file.name, type: file.type || 'application/octet-stream', content: base64 })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---- PrimeVue DataTable 过滤状态 ----
// 全局搜索
const globalFilter = ref('')

// 按列搜索（简单 contains 匹配）
const colFilters = ref({
  email:       { value: null, matchMode: 'contains' },
  displayName: { value: null, matchMode: 'contains' },
  role:        { value: null, matchMode: 'contains' },
})

// 将 PrimeVue 需要的 filters 对象组合（包含 global）
const primeFilters = computed(() => ({
  global: { value: globalFilter.value, matchMode: 'contains' },
  email: colFilters.value.email,
  displayName: colFilters.value.displayName,
  role: colFilters.value.role,
}))

/* ---------- Lifecycle ---------- */
onMounted(async () => {
  try {
    await ensureAdminClaim()
    if (auth.user) await auth.user.getIdToken(true)
  } catch {}

  // soft guard
  if (!auth.user?.email?.endsWith('@admin.com')) {
    router.replace({ name: 'userHome' })
    return
  }

  await Promise.all([loadOverview(), load(), loadDailySignups()])
})

onBeforeUnmount(() => {
  destroyChart()
})
</script>

<style scoped>
/* keep defaults */
</style>
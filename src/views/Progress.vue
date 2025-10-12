<template>
  <div class="container py-4">
    <h2 class="fw-bold mb-4">Progress</h2>

    <!-- Input -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Date</label>
            <input type="date" class="form-control" v-model="entry.date" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Weight (kg)</label>
            <input type="number" class="form-control" v-model.number="entry.weight" />
          </div>
          <div class="col-md-4 d-flex gap-2">
            <button class="btn btn-dark flex-grow-1" @click="addEntry">Add</button>
            <button class="btn btn-outline-dark flex-grow-1" @click="syncOffline">Sync</button>
          </div>
        </div>
        <p class="text-muted small mt-2 mb-0">
          Saves to Firestore when online; otherwise cached locally and synced later.
        </p>
        <p class="small mb-0" :class="online ? 'text-success' : 'text-danger'">
          Status: {{ online ? 'Online' : 'Offline (local cache)' }}
        </p>
      </div>
    </div>

    <!-- Chart -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Weight Trend</h6>
        <canvas ref="chartEl" height="100"></canvas>
      </div>
    </div>

    <!-- Recent table -->
    <div class="card shadow-sm border-0">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h6 class="fw-bold m-0">Recent Entries</h6>
          <small class="text-muted">{{ recentEntries.length }} items</small>
        </div>

        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th style="width: 160px;">Date</th>
                <th style="width: 120px;">Weight (kg)</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in recentEntries" :key="r._key ?? i">
                <td><code>{{ r.date }}</code></td>
                <td class="fw-semibold">{{ Number(r.weight).toFixed(1) }}</td>
                <td>
                  <span class="badge" :class="r._pending ? 'text-bg-secondary' : 'text-bg-success'">
                    {{ r._pending ? 'Local cache' : 'Cloud' }}
                  </span>
                </td>
              </tr>
              <tr v-if="!recentEntries.length">
                <td colspan="3" class="text-muted text-center">No entries yet.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <small class="text-muted d-block mt-2">Tip: Add while offline, then click “Sync” when back online.</small>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue
import { ref, computed, onMounted } from 'vue'

// Firebase
import { getAuth } from 'firebase/auth'
import { db } from '../firebase'
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'

// Chart.js
import {
  Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale
} from 'chart.js'
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale)

/* ------------ reactive states ------------ */
const auth = getAuth()
const online = ref(navigator.onLine)
const entry = ref({ date: new Date().toISOString().slice(0, 10), weight: null })
const records = ref([]) // merged: cloud + local (for chart & table)
const chartEl = ref(null)
let chart

/* ------------ online/offline detection ------------ */
window.addEventListener('online', () => online.value = true)
window.addEventListener('offline', () => online.value = false)

/* ------------ local storage (per email) ------------ */
const STORAGE_PREFIX = 'luminher_progress_'
const storageKey = () => STORAGE_PREFIX + (auth.currentUser?.email || 'guest').toLowerCase()
function readLocal() { try { return JSON.parse(localStorage.getItem(storageKey()) || '[]') } catch { return [] } }
function writeLocal(arr) { localStorage.setItem(storageKey(), JSON.stringify(arr)) }

/* ------------ add entry ------------ */
async function addEntry() {
  if (!entry.value.weight || !entry.value.date) return alert('Please fill both date and weight.')
  const data = { date: entry.value.date, weight: Number(entry.value.weight), ts: Date.now() }

  if (online.value && auth.currentUser) {
    try {
      const colRef = collection(db, 'users', auth.currentUser.uid, 'progress')
      await addDoc(colRef, data)
      records.value.push({ ...data, _pending: false, _key: `c_${data.ts}` })
    } catch (err) {
      // fallback to local cache
      cacheOffline(data)
    }
  } else {
    cacheOffline(data)
  }

  renderChart()
  entry.value = { date: new Date().toISOString().slice(0, 10), weight: null }
}

/* ------------ cache & sync ------------ */
function cacheOffline(d) {
  const list = readLocal()
  list.push({ ...d, _pending: true })
  writeLocal(list)
  records.value.push({ ...d, _pending: true, _key: `l_${d.ts}` })
}

async function syncOffline() {
  if (!auth.currentUser) return alert('Login required to sync.')
  const cached = readLocal()
  if (!cached.length) return alert('No cached entries.')

  try {
    const colRef = collection(db, 'users', auth.currentUser.uid, 'progress')
    for (const d of cached) await addDoc(colRef, { date: d.date, weight: d.weight, ts: d.ts })
    localStorage.removeItem(storageKey())

    // mark local ones as cloud in the in-memory list
    records.value = records.value.map(r => ({ ...r, _pending: false }))
    renderChart()
    alert(`✅ Synced ${cached.length} entries!`)
  } catch (err) {
    console.error('Sync error:', err)
    alert('❌ Sync failed: ' + (err?.message || 'unknown'))
  }
}

/* ------------ load existing cloud records ------------ */
async function loadCloud() {
  if (!auth.currentUser) return
  try {
    const colRef = collection(db, 'users', auth.currentUser.uid, 'progress')
    // sort by ts if present; otherwise by date string
    const snap = await getDocs(query(colRef, orderBy('ts', 'asc')))
    const arr = []
    snap.forEach(doc => {
      const d = doc.data()
      arr.push({ date: d.date, weight: Number(d.weight), ts: d.ts ?? Date.parse(d.date), _pending: false, _key: doc.id })
    })
    return arr
  } catch (e) {
    console.warn('Could not load Firestore data:', e)
    return []
  }
}

/* ------------ derived: recent table (desc, max 30) ------------ */
const recentEntries = computed(() => {
  const arr = [...records.value]
  arr.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
  return arr.slice(0, 30)
})

/* ------------ chart ------------ */
function renderChart() {
  if (!chartEl.value) return
  // sort by time asc for a smooth line
  const sorted = [...records.value].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0))
  const labels = sorted.map(e => e.date)
  const data = sorted.map(e => e.weight)

  if (chart) chart.destroy()
  chart = new Chart(chartEl.value, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Weight (kg)', data, borderColor: '#1f7aec', tension: 0.3, fill: false }] },
    options: { scales: { y: { title: { display: true, text: 'kg' }, beginAtZero: false } } }
  })
}

/* ------------ init ------------ */
onMounted(async () => {
  // start with local cache (if any)
  const local = readLocal()
  records.value = local.map(d => ({ ...d, _key: `l_${d.ts}` }))

  // merge cloud
  const cloud = await loadCloud()
  if (cloud?.length) records.value.push(...cloud)

  renderChart()
})
</script>

<style scoped>
canvas { width: 100%; max-height: 320px; }
</style>
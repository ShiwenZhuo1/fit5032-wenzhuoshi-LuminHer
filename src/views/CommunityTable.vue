<template>
  <section class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <h2 class="m-0 fw-bold">Community Plans</h2>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" @click="exportCsv">Export CSV</button>
      </div>
    </div>

    <div class="d-flex flex-wrap gap-2 mb-3">
      <span class="position-relative" style="max-width:280px">
        <i class="pi pi-search position-absolute" style="left:10px; top:10px;"></i>
        <InputText v-model="globalFilter" placeholder="Search all columns" class="form-control ps-5" />
      </span>
      <InputText v-model="colFilters.title.value"       placeholder="Filter: Title"       class="form-control" />
      <InputText v-model="colFilters.ownerName.value"  placeholder="Filter: Owner"       class="form-control" />
      <InputText v-model="colFilters.ownerEmail.value" placeholder="Filter: Owner Email" class="form-control" />
    </div>

    <DataTable
      :value="rows"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :rowsPerPageOptions="[10,20,50]"
      stripedRows
      responsiveLayout="scroll"
      :globalFilterFields="['title','ownerName','ownerEmail']"
      :filters="primeFilters"
      ref="tableRef"
    >
      <Column field="title" header="Title" sortable />
      <Column field="ownerName" header="Owner" sortable />
      <Column field="ownerEmail" header="Owner Email" sortable />
      <Column field="avg" header="Avg ★" sortable>
        <template #body="{ data }">{{ data.avg.toFixed(1) }}</template>
      </Column>
      <Column field="count" header="#Ratings" sortable />
      <Column field="createdAt" header="Created" sortable>
        <template #body="{ data }">{{ fmt(data.createdAt) }}</template>
      </Column>
    </DataTable>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRatings } from '../stores/ratings'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

const ratings = useRatings()
const rows = computed(() => ratings.withStats)

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

// Filters
const globalFilter = ref('')
const colFilters = ref({
  title: { value: null, matchMode: 'contains' },
  ownerName: { value: null, matchMode: 'contains' },
  ownerEmail: { value: null, matchMode: 'contains' },
})
const primeFilters = computed(() => ({
  global: { value: globalFilter.value, matchMode: 'contains' },
  title: colFilters.value.title,
  ownerName: colFilters.value.ownerName,
  ownerEmail: colFilters.value.ownerEmail,
}))

const tableRef = ref(null)

function exportCsv() {
  const list = rows.value
  // 简单导出：应用当前 filters 后导出
  const filtered = list.filter(r => {
    const g = (globalFilter.value || '').toLowerCase()
    const okGlobal = !g || [r.title, r.ownerName, r.ownerEmail].some(v => String(v || '').toLowerCase().includes(g))
    const f1 = (colFilters.value.title.value || '')
    const f2 = (colFilters.value.ownerName.value || '')
    const f3 = (colFilters.value.ownerEmail.value || '')
    const ok1 = !f1 || String(r.title || '').includes(f1)
    const ok2 = !f2 || String(r.ownerName || '').includes(f2)
    const ok3 = !f3 || String(r.ownerEmail || '').includes(f3)
    return okGlobal && ok1 && ok2 && ok3
  })
  const csv = toCsv(filtered, ['id','title','ownerName','ownerEmail','avg','count','createdAt'])
  downloadText(csv, 'community.csv', 'text/csv;charset=utf-8;')
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
</script>

<style scoped>
/* keep defaults */
</style>



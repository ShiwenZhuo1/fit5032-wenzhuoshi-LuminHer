// src/lib/adminApi.js
const BASE = import.meta.env.VITE_FN_BASE
const KEY  = import.meta.env.VITE_FN_API_KEY

function withKey(url) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}key=${encodeURIComponent(KEY)}`
}

export async function fetchMetrics() {
  const url = withKey(`${BASE}/apiMetrics`)
  const res = await fetch(url, { headers: { 'x-api-key': KEY } })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'metrics failed')
  return data.metrics
}

export async function fetchHealth() {
  const res = await fetch(`${BASE}/apiHealth`)
  const data = await res.json()
  if (!res.ok) throw new Error('health failed')
  return data
}

export async function fetchDailySignups() {
  const url = withKey(`${BASE}/apiDailySignups`)
  const res = await fetch(url, { headers: { 'x-api-key': KEY } })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.error || 'daily signups failed')
  return data // { ok:true, range:{start,end}, series:[{date,count}] }
}
// src/stores/ratings.js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'luminher_shared_plans_v1'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}
function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const useRatings = defineStore('ratings', {
  state: () => ({
    // each item: { id, title, ownerName, ownerEmail, createdAt, payload, ratings: { [userEmail]: number } }
    shared: load(),
  }),

  getters: {
    // list with computed average & count
    withStats: (state) => state.shared.map(p => {
      const vals = Object.values(p.ratings || {})
      const count = vals.length
      const avg = count ? (vals.reduce((a,b)=>a+b,0) / count) : 0
      return { ...p, avg, count }
    }),
    // quick lookup
    byId: (state) => (id) => state.shared.find(p => p.id === id),
  },

  actions: {
    sharePlan({ title, payload, ownerName, ownerEmail }) {
      const id = crypto.randomUUID()
      const item = {
        id, title: title?.trim() || 'Untitled plan',
        ownerName, ownerEmail,
        createdAt: new Date().toISOString(),
        payload,
        ratings: {} // email -> 1..5
      }
      this.shared.unshift(item)
      save(this.shared)
      return id
    },
    rate(planId, userEmail, value) {
      const p = this.shared.find(x => x.id === planId)
      if (!p) return
      const v = Math.max(1, Math.min(5, Number(value)))
      p.ratings[userEmail] = v
      save(this.shared)
    },
    remove(planId, userEmail) { // allow owner delete (可选)
      const i = this.shared.findIndex(x => x.id === planId && x.ownerEmail === userEmail)
      if (i >= 0) {
        this.shared.splice(i, 1)
        save(this.shared)
      }
    }
  }
})
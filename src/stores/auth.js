// src/stores/auth.js
import { defineStore } from 'pinia'

const STORAGE_KEY = 'luminher_auth'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,              // { name, email, role: 'user' | 'admin' }
    isAuthenticated: false,
  }),

  actions: {
    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const data = JSON.parse(raw)
        this.user = data.user || null
        this.isAuthenticated = !!this.user
      } catch {}
    },

    login({ email, password, role }) {
    
      const user = {
        name: email.split('@')[0],
        email,
        role: role || 'user',
      }
      this.user = user
      this.isAuthenticated = true
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }))
      return user.role
    },

    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})
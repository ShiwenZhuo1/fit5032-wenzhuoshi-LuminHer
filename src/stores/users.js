// src/stores/users.js
import { defineStore } from 'pinia'

const KEY = 'luminher_users'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export const useUsers = defineStore('users', {
  state: () => ({
    list: load(), // [{name,email,password,role}]
  }),
  actions: {
    ensureSeedAdmin() {
      if (!this.list.some(u => u.email === 'admin@admin.com')) {
        this.list.push({
          name: 'Admin',
          email: 'admin@admin.com',
          password: 'Admin123!',
          role: 'admin',
        })
        save(this.list)
      }
    },
    exists(email) {
      return this.list.some(u => u.email === email.toLowerCase())
    },
    register({ name, email, password, role }) {
      const lower = email.toLowerCase()
      if (this.exists(lower)) throw new Error('Email already exists')
      const user = { name, email: lower, password, role }
      this.list.push(user)
      save(this.list)
      return user
    },
    findByEmail(email) {
      const lower = email.toLowerCase()
      return this.list.find(u => u.email === lower) || null
    },
    validate(email, password) {
      const u = this.findByEmail(email)
      if (!u) return null
      return u.password === password ? u : null
    }
  }
})
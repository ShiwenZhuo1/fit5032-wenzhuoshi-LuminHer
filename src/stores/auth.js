import { defineStore } from 'pinia'

const USERS_KEY = 'luminher_users'
const AUTH_KEY  = 'luminher_auth'

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') }
  catch { return [] }
}
function saveUsers(list) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list))
}

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    users: loadUsers()
  }),
  actions: {
    register(newUser) {
      this.users.push(newUser)
      saveUsers(this.users)
      this.user = newUser
      this.isAuthenticated = true
      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser))
    },
    validate(email, password) {   // 👈 登录验证
      const found = this.users.find(u => u.email === email && u.password === password)
      return found || null
    },
    login(user) {
      this.user = user
      this.isAuthenticated = true
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    },
    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem(AUTH_KEY)
    },
    loadFromStorage() {
      try {
        const saved = JSON.parse(localStorage.getItem(AUTH_KEY))
        if (saved) {
          this.user = saved
          this.isAuthenticated = true
        }
        this.users = loadUsers()
      } catch {
        this.user = null
        this.isAuthenticated = false
        this.users = []
      }
    }
  }
})
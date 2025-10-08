import { defineStore } from 'pinia'
import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    ready: false,
  }),

  getters: {
    role: (state) => {
      if (!state.user?.email) return null
      return state.user.email.endsWith('@admin.com') ? 'admin' : 'user'
    },
    isAdmin: (state) => state.user?.email?.endsWith('@admin.com') || false,
  },

  actions: {
    async register({ name, email, password }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name?.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() })
      }
      this.user = cred.user
      this.isAuthenticated = true
    },

    async login({ email, password }) {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      this.user = cred.user
      this.isAuthenticated = true
    },

    async logout() {
      await signOut(auth)
      this.user = null
      this.isAuthenticated = false
    },

    initAuthListener() {
      onAuthStateChanged(auth, (u) => {
        this.user = u || null
        this.isAuthenticated = !!u
        this.ready = true
      })
    },
  },
})
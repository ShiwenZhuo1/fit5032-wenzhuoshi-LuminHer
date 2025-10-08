// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

// Pinia + Auth
import { useAuth } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize Firebase Auth listener before router
const auth = useAuth()
auth.initAuthListener()

// Router + PrimeVue
app.use(router)
app.use(PrimeVue, { theme: { preset: Aura } })

// Mount app
app.mount('#app')
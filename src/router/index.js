import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',          name: 'home',      component: () => import('../views/Home.vue') },
  { path: '/map',       name: 'map',       component: () => import('../views/Map.vue') },
  { path: '/progress',  name: 'progress',  component: () => import('../views/Progress.vue') },
  { path: '/plans',     name: 'plans',     component: () => import('../views/Plans.vue') },
  { path: '/community', name: 'community', component: () => import('../views/Community.vue') },
  { path: '/account',   name: 'account',   component: () => import('../views/Account.vue') },
  // src/router/index.js
  { path: '/auth/register', name: 'register', component: () => import('../views/auth/Register.vue') },
  { path: '/auth/login',    name: 'login',    component: () => import('../views/auth/Login.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
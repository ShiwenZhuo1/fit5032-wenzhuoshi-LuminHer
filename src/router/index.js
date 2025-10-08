import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/auth/Login.vue'
import Register from '../views/auth/Register.vue'
const PlanIndex = () => import('../plans/PlanIndex.vue')
const PlanForm = () => import('../plans/PlanForm.vue')
import Map from '../views/Map.vue'
import Progress from '../views/Progress.vue'
import Community from '../views/Community.vue'
import Account from '../views/Account.vue'
import { useAuth } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/auth/login', name: 'login', component: Login },
    { path: '/auth/register', name: 'register', component: Register },
    { path: '/plans', name: 'plans', component: PlanIndex },
    { path: '/plans/new', name: 'planForm', component: PlanForm },
    { path: '/map', name: 'map', component: Map },
    { path: '/progress', name: 'progress', component: Progress },
    { path: '/community', name: 'community', component: Community },
    { path: '/account', name: 'account', component: Account },
    {
      path: '/dashboard',
      name: 'userHome',
      component: () => import('../views/user/UserDashboard.vue'),
      meta: { auth: true, role: 'user' },
    },
    {
      path: '/admin',
      name: 'adminHome',
      component: () => import('../views/admin/AdminDashboard.vue'),
      meta: { auth: true, role: 'admin' },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuth()

  if (to.meta?.auth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta?.role && auth.isAuthenticated) {
    if (auth.role !== to.meta.role) {
      return auth.isAdmin ? { name: 'adminHome' } : { name: 'userHome' }
    }
  }

  return true
})

export default router
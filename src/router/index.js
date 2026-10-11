import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import UsernameView from '../views/UsernameView.vue'
import PlayView from '../views/PlayView.vue'
import SecretView from '../views/SecretView.vue'
import GameView from '../views/GameView.vue'
import ResultView from '../views/ResultView.vue'
import HistoryView from '../views/HistoryView.vue'
import MatchDetailView from '../views/MatchDetailView.vue'
import FriendsView from '../views/FriendsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/username', name: 'username', component: UsernameView },
    { path: '/play', name: 'play', component: PlayView },
    { path: '/secret/:id', name: 'secret', component: SecretView },
    { path: '/game/:id', name: 'game', component: GameView },
    { path: '/result/:id', name: 'result', component: ResultView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/matches/:id', name: 'matchDetail', component: MatchDetailView },
    { path: '/friends', name: 'friends', component: FriendsView },
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    await authStore.initAuth()
  }

  const publicRoutes = ['login']
  if (!publicRoutes.includes(to.name) && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }
  if (to.name !== 'username' && authStore.needsUsername) {
    return next({ name: 'username' })
  }
  if ((to.name === 'login' || to.name === 'username') && authStore.isAuthenticated && !authStore.needsUsername) {
    return next({ name: 'home' })
  }
  next()
})

export default router

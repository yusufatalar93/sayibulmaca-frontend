import os

frontend_dir = "/Users/yusufatalar/dev/number game/frontend"

files = {
    "src/firebase.js": """import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
""",
    "src/utils/api.js": """import { auth } from '../firebase'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function fetchWithAuth(endpoint, options = {}) {
  const headers = { ...options.headers }
  
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken()
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || response.statusText)
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export default {
  get: (endpoint) => fetchWithAuth(endpoint),
  post: (endpoint, body) => fetchWithAuth(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => fetchWithAuth(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' })
}
""",
    "src/stores/auth.js": """import { defineStore } from 'pinia'
import { auth } from '../firebase'
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    initialized: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    needsUsername: (state) => state.user && !state.user.username
  },
  actions: {
    initAuth() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            this.token = await firebaseUser.getIdToken()
            await this.loadProfile()
          } else {
            this.user = null
            this.token = null
          }
          this.initialized = true
          resolve()
        })
      })
    },
    async loginWithEmail(email, password) {
      this.loading = true
      try {
        await signInWithEmailAndPassword(auth, email, password)
      } finally {
        this.loading = false
      }
    },
    async registerWithEmail(email, password) {
      this.loading = true
      try {
        await createUserWithEmailAndPassword(auth, email, password)
      } finally {
        this.loading = false
      }
    },
    async loginWithGoogle() {
      this.loading = true
      try {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
      } finally {
        this.loading = false
      }
    },
    async logout() {
      this.loading = true
      try {
        await signOut(auth)
        this.user = null
        this.token = null
      } finally {
        this.loading = false
      }
    },
    async loadProfile() {
      try {
        const profile = await api.get('/api/me')
        this.user = profile
      } catch (e) {
        console.error('Failed to load profile', e)
        // If error, keep user as null so it falls back to login/username
      }
    },
    async setUsername(username) {
      this.loading = true
      try {
        const profile = await api.put('/api/me/username', { username })
        this.user = profile
      } finally {
        this.loading = false
      }
    },
    async resetPassword(email) {
      this.loading = true
      try {
        await sendPasswordResetEmail(auth, email)
      } finally {
        this.loading = false
      }
    }
  }
})
""",
    "src/router/index.js": """import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import UsernameView from '../views/UsernameView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/username',
      name: 'username',
      component: UsernameView
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.initialized) {
    await authStore.initAuth()
  }

  if (to.name !== 'login' && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name !== 'username' && authStore.needsUsername) {
    next({ name: 'username' })
  } else if ((to.name === 'login' || to.name === 'username') && authStore.isAuthenticated && !authStore.needsUsername) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
""",
    "src/App.vue": """<template>
  <div v-if="!authStore.initialized" class="loading-screen">
    Yükleniyor...
  </div>
  <router-view v-else></router-view>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from './stores/auth'

export default {
  name: 'App',
  computed: {
    ...mapStores(useAuthStore)
  },
  created() {
    this.authStore.initAuth()
  }
}
</script>

<style>
.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
}
</style>
""",
    "src/views/LoginView.vue": """<template>
  <div class="login-view">
    <div class="logo-container">
      <h1>Sayı Bulmaca</h1>
    </div>

    <div class="card">
      <button class="google-btn" @click="handleGoogleLogin" :disabled="authStore.loading">
        Google ile Devam Et
      </button>

      <div class="divider">
        <span>veya</span>
      </div>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Giriş Yap</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Kayıt Ol</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>E-posta</label>
          <input type="email" v-model="email" required />
        </div>
        
        <div class="form-group">
          <label>Şifre</label>
          <input type="password" v-model="password" required />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="authStore.loading">
          {{ mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol' }}
        </button>
      </form>

      <div v-if="mode === 'login'" class="forgot-password">
        <a href="#" @click.prevent="handleResetPassword">Şifremi Unuttum</a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'LoginView',
  data() {
    return {
      mode: 'login',
      email: '',
      password: '',
      error: ''
    }
  },
  computed: {
    ...mapStores(useAuthStore)
  },
  methods: {
    async handleGoogleLogin() {
      this.error = ''
      try {
        await this.authStore.loginWithGoogle()
        this.$router.push('/')
      } catch (e) {
        this.error = e.message
      }
    },
    async handleSubmit() {
      this.error = ''
      try {
        if (this.mode === 'login') {
          await this.authStore.loginWithEmail(this.email, this.password)
        } else {
          await this.authStore.registerWithEmail(this.email, this.password)
        }
        this.$router.push('/')
      } catch (e) {
        this.error = e.message
      }
    },
    async handleResetPassword() {
      if (!this.email) {
        this.error = 'Lütfen e-posta adresinizi girin'
        return
      }
      this.error = ''
      try {
        await this.authStore.resetPassword(this.email)
        alert('Şifre sıfırlama e-postası gönderildi')
      } catch (e) {
        this.error = e.message
      }
    }
  }
}
</script>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 480px;
  margin: 0 auto;
}
.logo-container {
  margin-bottom: 2rem;
  text-align: center;
}
.card {
  width: 100%;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.google-btn {
  width: 100%;
  padding: 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
}
.divider {
  text-align: center;
  margin: 1rem 0;
  position: relative;
}
.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: 1px solid #ccc;
  z-index: 1;
}
.divider span {
  background: white;
  padding: 0 10px;
  position: relative;
  z-index: 2;
  color: #666;
}
.tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #eee;
}
.tabs button {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
}
.tabs button.active {
  border-bottom: 2px solid #4285f4;
  color: #4285f4;
  font-weight: bold;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}
.error-msg {
  color: red;
  margin: 1rem 0;
}
.forgot-password {
  text-align: center;
  margin-top: 1rem;
}
</style>
""",
    "src/views/UsernameView.vue": """<template>
  <div class="username-view">
    <div class="card">
      <h2>Hoş Geldiniz!</h2>
      <p>Lütfen oyunda kullanacağınız benzersiz bir kullanıcı adı belirleyin.</p>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <input 
            type="text" 
            v-model="username" 
            placeholder="Kullanıcı Adı"
            pattern="^[a-zA-Z0-9_]{3,20}$"
            required
            :disabled="authStore.loading"
          />
          <small>3-20 karakter. Sadece harf, rakam ve alt çizgi.</small>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="submit-btn" :disabled="authStore.loading || !username">
          Kaydet ve Başla
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'UsernameView',
  data() {
    return {
      username: '',
      error: ''
    }
  },
  computed: {
    ...mapStores(useAuthStore)
  },
  methods: {
    async handleSubmit() {
      this.error = ''
      try {
        await this.authStore.setUsername(this.username)
        this.$router.push('/')
      } catch (e) {
        this.error = 'Kullanıcı adı alınamamış veya geçersiz olabilir.'
      }
    }
  }
}
</script>

<style scoped>
.username-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 480px;
  margin: 0 auto;
}
.card {
  width: 100%;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.form-group {
  margin: 1.5rem 0;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1.2rem;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
.error-msg {
  color: red;
  margin: 1rem 0;
}
</style>
""",
    "src/views/HomeView.vue": """<template>
  <div class="home-view">
    <div class="header">
      <h2>Sayı Bulmaca</h2>
      <div class="user-info" v-if="authStore.user">
        <span>{{ authStore.user.username }}</span>
        <button @click="handleLogout">Çıkış</button>
      </div>
    </div>
    
    <div v-if="authStore.user" class="ratings">
      <h3>Dereceleriniz</h3>
      <ul>
        <li v-for="r in authStore.user.ratings" :key="r.digitMode">
          {{ r.digitMode }} Basamak: {{ r.rating }} ({{ r.league }} {{ r.tier }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'HomeView',
  computed: {
    ...mapStores(useAuthStore)
  },
  methods: {
    async handleLogout() {
      await this.authStore.logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.home-view {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}
.ratings {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 8px;
}
</style>
"""
}

for path, content in files.items():
    full_path = os.path.join(frontend_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)

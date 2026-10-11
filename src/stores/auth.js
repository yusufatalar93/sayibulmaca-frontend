import { defineStore } from 'pinia'
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

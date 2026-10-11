<template>
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

        <div v-if="success" class="success-msg">{{ success }}</div>
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
      error: '',
      success: ''
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
          this.$router.push('/')
        } else {
          await this.authStore.registerWithEmail(this.email, this.password)
          await this.authStore.logout()
          this.success = 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.'
          this.mode = 'login'
          this.password = ''
        }
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
.success-msg {
  color: #2e7d32;
  background: #e8f5e9;
  border-radius: 4px;
  padding: 10px;
  margin: 1rem 0;
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

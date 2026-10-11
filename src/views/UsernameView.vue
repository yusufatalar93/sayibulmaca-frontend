<template>
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

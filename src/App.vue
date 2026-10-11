<template>
  <div v-if="!authStore.initialized" class="loading-screen">
    Yükleniyor...
  </div>
  <router-view v-else></router-view>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from './stores/auth'
import { useGameStore } from './stores/game'

export default {
  name: 'App',
  computed: {
    ...mapStores(useAuthStore, useGameStore)
  },
  created() {
    this.authStore.initAuth()
  },
  watch: {
    'authStore.isAuthenticated'(val) {
      if (val) {
        this.gameStore.connect()
      } else {
        this.gameStore.disconnect()
      }
    },
    'gameStore.phase'(val) {
      if (val === 'secret' && this.$route.name !== 'secret') {
        this.$router.push(`/secret/${this.gameStore.matchId}`)
      }
    }
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

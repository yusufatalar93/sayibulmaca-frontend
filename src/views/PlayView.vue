<template>
  <div class="play-view">
    <div class="card">
      <div class="spinner-wrap">
        <div class="spinner"></div>
      </div>
      <h2>{{ t('game.waiting') }}</h2>
      <p class="wait-time">{{ waitDisplay }}</p>
      <button class="cancel-btn" @click="cancel">{{ t('game.cancel') }}</button>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useGameStore } from '../stores/game'
import { t } from '../utils/locale.js'

export default {
  name: 'PlayView',
  data() {
    return { elapsed: 0, timer: null }
  },
  computed: {
    ...mapStores(useGameStore),
    waitDisplay() {
      const s = this.elapsed
      const m = Math.floor(s / 60)
      const sec = s % 60
      return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
    }
  },
  watch: {
    'gameStore.phase'(val) {
      if (val === 'secret') {
        this.$router.push(`/secret/${this.gameStore.matchId}`)
      }
    }
  },
  mounted() {
    this.timer = setInterval(() => { this.elapsed++ }, 1000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    t,
    cancel() {
      this.gameStore.leaveQueue()
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.play-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}
.card {
  text-align: center;
  padding: 3rem 2rem;
  max-width: 320px;
  width: 100%;
}
.spinner-wrap {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}
.spinner {
  width: 56px;
  height: 56px;
  border: 4px solid var(--color-surface);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
h2 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.wait-time {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-accent);
  margin-bottom: 2rem;
}
.cancel-btn {
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}
</style>

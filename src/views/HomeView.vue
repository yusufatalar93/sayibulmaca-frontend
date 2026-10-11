<template>
  <div class="home-view">
    <header class="top-bar">
      <h1 class="app-title">Sayı Bulmaca</h1>
      <div class="user-info" v-if="authStore.user">
        <span class="username">{{ authStore.user.username }}</span>
        <button class="btn-ghost" @click="handleLogout">{{ t('auth.logout') }}</button>
      </div>
    </header>

    <div class="content" v-if="authStore.user">
      <!-- Ratings -->
      <div class="ratings-row">
        <div
          v-for="r in authStore.user.ratings"
          :key="r.digitMode"
          class="rating-card"
        >
          <div class="league-badge">{{ t('league.' + r.league) }} {{ r.tier || '' }}</div>
          <div class="rating-number">{{ r.rating }}</div>
          <div class="digit-label">{{ r.digitMode }} {{ t('home.digits4').split(' ')[1] }}</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (r.progressToNextTier / 50 * 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Mode selection -->
      <div class="section">
        <div class="toggle-group">
          <button
            :class="['toggle-btn', selectedDigitMode === 4 ? 'active' : '']"
            @click="selectedDigitMode = 4"
          >{{ t('home.digits4') }}</button>
          <button
            :class="['toggle-btn', selectedDigitMode === 5 ? 'active' : '']"
            @click="selectedDigitMode = 5"
          >{{ t('home.digits5') }}</button>
        </div>
      </div>

      <!-- Time control selection -->
      <div class="section">
        <div class="toggle-group">
          <button
            v-for="tc in timeControls"
            :key="tc.value"
            :class="['toggle-btn', selectedTimeControl === tc.value ? 'active' : '']"
            @click="selectedTimeControl = tc.value"
          >
            {{ t('home.' + tc.label) }}
            <small>{{ tc.time }}</small>
          </button>
        </div>
      </div>

      <!-- Play button -->
      <button class="play-btn" @click="handlePlay">{{ t('home.play') }}</button>

      <!-- Nav links -->
      <div class="nav-links">
        <router-link to="/history" class="nav-link">{{ t('home.matchHistory') }}</router-link>
        <router-link to="/friends" class="nav-link friends-link">
          Arkadaşlar
          <span class="badge" v-if="friendsStore.pendingCount > 0">{{ friendsStore.pendingCount }}</span>
        </router-link>
      </div>
    </div>

    <!-- Incoming challenge banner (shown anywhere in app) -->
    <div class="challenge-banner" v-if="friendsStore.incomingChallenge">
      <div class="challenge-info">
        <strong>{{ friendsStore.incomingChallenge.challengerUsername }}</strong>
        sizi {{ friendsStore.incomingChallenge.digitMode }} basamaklı maca davet ediyor!
      </div>
      <div class="challenge-actions">
        <button class="btn-accept" @click="handleAcceptChallenge">Kabul Et</button>
        <button class="btn-decline" @click="handleDeclineChallenge">Reddet</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useGameStore } from '../stores/game'
import { useFriendsStore } from '../stores/friends'
import { t } from '../utils/locale.js'

export default {
  name: 'HomeView',
  data() {
    return {
      selectedDigitMode: 4,
      selectedTimeControl: 'NORMAL',
    }
  },
  computed: {
    ...mapStores(useAuthStore, useGameStore, useFriendsStore),
    timeControls() {
      const d = this.selectedDigitMode
      return [
        { value: 'FAST', label: 'fast', time: d === 4 ? '2 dk' : '3 dk' },
        { value: 'NORMAL', label: 'normal', time: d === 4 ? '4 dk' : '6 dk' },
        { value: 'LONG', label: 'long', time: d === 4 ? '8 dk' : '12 dk' },
      ]
    }
  },
  methods: {
    t,
    async handlePlay() {
      await this.gameStore.connect()
      this.gameStore.resetForNewGame()
      this.gameStore.joinQueue(this.selectedDigitMode, this.selectedTimeControl)
      this.$router.push('/play')
    },
    async handleLogout() {
      await this.authStore.logout()
      this.gameStore.disconnect()
      this.$router.push('/login')
    },
    handleAcceptChallenge() {
      const c = this.friendsStore.incomingChallenge
      if (!c) return
      this.gameStore.acceptChallenge(c.challengeId)
      this.friendsStore.clearIncomingChallenge()
      this.$router.push('/play')
    },
    handleDeclineChallenge() {
      const c = this.friendsStore.incomingChallenge
      if (!c) return
      this.gameStore.declineChallenge(c.challengeId)
      this.friendsStore.clearIncomingChallenge()
    },
  },
  async created() {
    this.friendsStore.loadFriends()
    this.friendsStore.loadPendingRequests()

    const user = this.authStore.user
    if (!user?.activeMatchId) {
      this.gameStore.resetForNewGame()
    }

    if (user?.activeMatchId) {
      const phase = user.activeMatchPhase
      if (phase === 'secret') {
        this.gameStore.matchId = user.activeMatchId
        this.gameStore.phase = 'secret'
        await this.gameStore.connect()
        this.$router.push(`/secret/${user.activeMatchId}`)
      } else if (phase === 'playing') {
        this.gameStore.matchId = user.activeMatchId
        this.gameStore.phase = 'playing'
        await this.gameStore.connect()
        this.$router.push(`/game/${user.activeMatchId}`)
      }
    }
  }
}
</script>

<style scoped>
.home-view {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  background: var(--color-bg);
}
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-surface);
  margin-bottom: 2rem;
}
.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.username {
  font-weight: 600;
}
.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.ratings-row {
  display: flex;
  gap: 1rem;
}
.rating-card {
  flex: 1;
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}
.league-badge {
  font-size: 0.8rem;
  color: var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
.rating-number {
  font-size: 2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.digit-label {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.6;
  margin-top: 0.25rem;
}
.progress-bar {
  margin-top: 0.5rem;
  height: 4px;
  background: var(--color-bg);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s ease;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.toggle-group {
  display: flex;
  gap: 0.5rem;
}
.toggle-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: 2px solid var(--color-surface);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.toggle-btn small {
  font-size: 0.7rem;
  opacity: 0.7;
  font-weight: 400;
}
.toggle-btn.active {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
}
.play-btn {
  width: 100%;
  padding: 1.25rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: opacity 0.15s;
}
.play-btn:hover {
  opacity: 0.9;
}
.nav-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.nav-link {
  color: var(--color-text);
  opacity: 0.7;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem;
  position: relative;
}
.friends-link { display: inline-flex; align-items: center; gap: 0.4rem; }
.badge {
  background: var(--color-minus);
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  padding: 1px 6px;
  font-weight: 700;
}
.challenge-banner {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2rem);
  max-width: 460px;
  background: var(--color-surface);
  border: 2px solid var(--color-accent);
  border-radius: 12px;
  padding: 1rem;
  z-index: 200;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.challenge-info { margin-bottom: 0.75rem; font-size: 0.95rem; }
.challenge-actions { display: flex; gap: 0.5rem; }
.btn-accept {
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-decline {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--color-minus);
  color: var(--color-minus);
  border-radius: 8px;
  cursor: pointer;
}
</style>

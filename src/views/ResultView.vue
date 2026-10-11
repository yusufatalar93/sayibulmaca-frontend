<template>
  <div class="result-view">
    <div class="result-card">
      <!-- Result header -->
      <div class="result-title" :class="resultClass">{{ resultLabel }}</div>

      <div class="end-reason">{{ reasonLabel }}</div>

      <!-- Secrets revealed -->
      <div class="secrets">
        <div class="secret-item">
          <div class="secret-label">Rakibin gizli sayısı</div>
          <div class="secret-value">{{ gameStore.opponentSecret }}</div>
        </div>
        <div class="secret-item" v-if="gameStore.mySecret">
          <div class="secret-label">Senin gizli sayın</div>
          <div class="secret-value my">{{ gameStore.mySecret }}</div>
        </div>
      </div>

      <!-- Rating change -->
      <div class="rating-section" v-if="gameStore.myRatingChange != null">
        <div class="rating-change" :class="gameStore.myRatingChange >= 0 ? 'positive' : 'negative'">
          {{ gameStore.myRatingChange >= 0 ? '+' : '' }}{{ gameStore.myRatingChange }}
        </div>
        <div class="new-rating">
          {{ gameStore.newLeague ? t('league.' + gameStore.newLeague) : '' }}
          {{ gameStore.newTier || '' }}
          &middot;
          {{ gameStore.newRating }}
        </div>
      </div>

      <!-- Actions -->
      <div class="actions">
        <button class="btn-again" @click="playAgain">{{ t('result.playAgain') }}</button>
        <button class="btn-home" @click="goHome">{{ t('result.backToHome') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useGameStore } from '../stores/game'
import { t } from '../utils/locale.js'

export default {
  name: 'ResultView',
  computed: {
    ...mapStores(useGameStore),
    resultClass() {
      return {
        won: this.gameStore.matchResult === 'won',
        lost: this.gameStore.matchResult === 'lost',
        draw: this.gameStore.matchResult === 'draw',
      }
    },
    resultLabel() {
      const r = this.gameStore.matchResult
      return r === 'won' ? t('result.won') : r === 'lost' ? t('result.lost') : t('result.draw')
    },
    reasonLabel() {
      const r = this.gameStore.endReason
      const map = { SOLVED: 'Sayı bulundu', TIMEOUT: 'Süre doldu', RESIGN: 'Pes edildi', ABORT: 'Maç iptal edildi', GUESS_LIMIT: 'Tahmin limiti' }
      return map[r] || ''
    }
  },
  methods: {
    t,
    playAgain() {
      const dm = this.gameStore.digitMode
      const tc = this.gameStore.timeControl
      this.gameStore.resetForNewGame()
      this.$router.push('/')
      this.$nextTick(() => {
        this.gameStore.joinQueue(dm, tc)
        this.$router.push('/play')
      })
    },
    goHome() {
      this.gameStore.resetForNewGame()
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.result-view {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.result-card {
  max-width: 360px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.result-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.result-title.won  { color: var(--color-plus); }
.result-title.lost { color: var(--color-minus); }
.result-title.draw { color: var(--color-accent); }
.end-reason {
  font-size: 0.9rem;
  opacity: 0.6;
}
.secrets {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.secret-item {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  flex: 1;
}
.secret-label {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.secret-value {
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-minus);
}
.secret-value.my {
  color: var(--color-plus);
}
.rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.rating-change {
  font-size: 2rem;
  font-weight: 700;
}
.rating-change.positive { color: var(--color-plus); }
.rating-change.negative { color: var(--color-minus); }
.new-rating {
  font-size: 0.9rem;
  opacity: 0.7;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.btn-again {
  width: 100%;
  padding: 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
.btn-home {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}
</style>

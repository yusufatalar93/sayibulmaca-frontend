<template>
  <div class="secret-view">
    <div class="opponent-info">
      <div class="opponent-badge">{{ gameStore.opponentLeague }} {{ gameStore.opponentTier }}</div>
      <div class="opponent-name">{{ gameStore.opponentUsername }}</div>
      <div class="opponent-rating">{{ gameStore.opponentRating }}</div>
    </div>

    <div class="timer-ring">
      <span class="timer-sec">{{ countdown }}</span>
      <span class="timer-label">{{ t('game.secretTimeout') }}</span>
    </div>

    <h2>{{ t('game.setYourSecret') }}</h2>

    <div v-if="!manualMode" class="mode-btns">
      <button class="btn-auto" @click="handleAutoAssign">{{ t('game.autoAssign') }}</button>
      <button class="btn-manual" @click="manualMode = true">{{ t('game.manualEntry') }}</button>
    </div>

    <div v-else class="manual-entry">
      <div class="digit-display">
        <span
          v-for="i in gameStore.digitMode"
          :key="i"
          class="digit-slot"
          :class="{ filled: secretInput.length >= i }"
        >{{ secretInput[i-1] || '_' }}</span>
      </div>
      <div class="keyboard">
        <button
          v-for="d in digits"
          :key="d"
          class="key"
          :disabled="isDigitDisabled(d)"
          @click="appendSecretDigit(d)"
        >{{ d }}</button>
        <button class="key key-del" @click="deleteSecretDigit">⌫</button>
      </div>
      <div v-if="secretError" class="error">{{ secretError }}</div>
      <div class="manual-actions">
        <button class="btn-confirm" :disabled="secretInput.length !== gameStore.digitMode" @click="handleManualSet">
          Onayla
        </button>
        <button class="btn-back" @click="manualMode = false">Geri</button>
      </div>
    </div>

    <div v-if="secretSet" class="secret-set-msg">
      Gizli sayın belirlendi, rakip bekleniyor...
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useGameStore } from '../stores/game'
import { t } from '../utils/locale.js'

export default {
  name: 'SecretView',
  data() {
    return {
      manualMode: false,
      secretInput: '',
      secretError: '',
      secretSet: false,
      countdown: 30,
      timer: null,
    }
  },
  computed: {
    ...mapStores(useGameStore),
    digits() { return [1,2,3,4,5,6,7,8,9,0] },
  },
  watch: {
    'gameStore.phase'(val) {
      if (val === 'playing') {
        this.$router.push(`/game/${this.gameStore.matchId}`)
      }
    }
  },
  mounted() {
    const timeoutAt = this.gameStore.secretTimeoutAt
    if (timeoutAt) {
      const update = () => {
        const remaining = Math.max(0, Math.ceil((timeoutAt - Date.now()) / 1000))
        this.countdown = remaining
        if (remaining > 0) this.timer = setTimeout(update, 500)
      }
      update()
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    t,
    handleAutoAssign() {
      this.gameStore.autoAssignSecret()
      this.secretSet = true
    },
    handleManualSet() {
      const input = this.secretInput
      if (input.length !== this.gameStore.digitMode) return
      this.secretError = ''
      this.gameStore.setSecret(input)
      this.secretSet = true
      this.manualMode = false
    },
    appendSecretDigit(d) {
      if (this.secretInput.includes(String(d))) return
      if (this.secretInput.length === 0 && d === 0) return
      if (this.secretInput.length >= this.gameStore.digitMode) return
      this.secretInput += String(d)
    },
    deleteSecretDigit() {
      this.secretInput = this.secretInput.slice(0, -1)
    },
    isDigitDisabled(d) {
      if (this.secretInput.length >= this.gameStore.digitMode) return true
      if (this.secretInput.includes(String(d))) return true
      if (this.secretInput.length === 0 && d === 0) return true
      return false
    }
  }
}
</script>

<style scoped>
.secret-view {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}
.opponent-info {
  text-align: center;
}
.opponent-badge {
  font-size: 0.8rem;
  color: var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
}
.opponent-name {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0.25rem 0;
}
.opponent-rating {
  font-size: 0.9rem;
  opacity: 0.7;
}
.timer-ring {
  width: 80px;
  height: 80px;
  border: 4px solid var(--color-accent);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.timer-sec {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}
.timer-label {
  font-size: 0.6rem;
  opacity: 0.6;
}
h2 {
  font-size: 1.1rem;
  font-weight: 600;
}
.mode-btns {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
.btn-auto {
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
.btn-manual {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}
.digit-display {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.digit-slot {
  width: 48px;
  height: 60px;
  border: 2px solid var(--color-surface);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.digit-slot.filled {
  border-color: var(--color-accent);
}
.keyboard {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.key {
  padding: 1rem 0;
  border: none;
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.1s;
}
.key:disabled {
  opacity: 0.3;
  cursor: default;
}
.key-del {
  grid-column: span 1;
}
.manual-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}
.btn-confirm {
  flex: 1;
  padding: 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}
.btn-confirm:disabled {
  opacity: 0.4;
}
.btn-back {
  padding: 1rem 1.5rem;
  background: transparent;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
}
.error {
  color: var(--color-minus);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}
.secret-set-msg {
  color: var(--color-plus);
  font-size: 0.95rem;
  text-align: center;
}
</style>

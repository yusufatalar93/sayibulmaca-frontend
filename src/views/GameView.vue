<template>
  <div class="game-view">
    <!-- Player cards -->
    <header class="players">
      <div class="player-card" :class="{ active: gameStore.iAmPlayerA && gameStore.isMyTurn || !gameStore.iAmPlayerA && !gameStore.isMyTurn }">
        <div class="player-name">{{ opponentUsername }}</div>
        <div class="clock" :class="{ low: opponentClockMs < 30000 }">{{ formatMs(opponentClockMs) }}</div>
      </div>
      <div class="vs">vs</div>
      <div class="player-card me" :class="{ active: gameStore.isMyTurn }">
        <div class="player-name">Sen</div>
        <div class="clock" :class="{ low: myClockMs < 30000 }">{{ formatMs(myClockMs) }}</div>
      </div>
    </header>

    <!-- Turn indicator -->
    <div class="turn-indicator" :class="{ myturn: gameStore.isMyTurn }">
      <span v-if="gameStore.finalTurnActive && gameStore.isMyTurn">{{ t('game.finalTurn') }}</span>
      <span v-else-if="gameStore.finalTurnActive && !gameStore.isMyTurn">{{ t('game.opponentFinalTurn') }}</span>
      <span v-else-if="gameStore.isMyTurn">{{ t('game.yourTurn') }}</span>
      <span v-else>{{ t('game.opponentTurn') }}</span>
    </div>

    <!-- Guesses board -->
    <div class="board">
      <div class="column">
        <div class="column-header">Sen</div>
        <div v-for="(g, i) in gameStore.myGuesses" :key="i" class="guess-row">
          <span class="guess-value">{{ g.value }}</span>
          <span class="plus" v-if="g.plus > 0">+{{ g.plus }}</span>
          <span class="minus" v-if="g.minus > 0">-{{ g.minus }}</span>
          <span class="zero" v-if="g.plus === 0 && g.minus === 0">0</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="column">
        <div class="column-header">Rakip</div>
        <div v-for="(g, i) in gameStore.opponentGuesses" :key="i" class="guess-row">
          <span class="guess-value">{{ g.value }}</span>
          <span class="plus" v-if="g.plus > 0">+{{ g.plus }}</span>
          <span class="minus" v-if="g.minus > 0">-{{ g.minus }}</span>
          <span class="zero" v-if="g.plus === 0 && g.minus === 0">0</span>
        </div>
      </div>
    </div>

    <!-- My secret (small, togglable) -->
    <div class="my-secret" v-if="gameStore.mySecret">
      <button class="secret-toggle" @click="showSecret = !showSecret">
        {{ t('game.secretNumber') }}: {{ showSecret ? gameStore.mySecret : '****' }}
      </button>
    </div>

    <!-- Error -->
    <div class="error-msg" v-if="gameStore.lastError">{{ gameStore.lastError }}</div>

    <!-- Keyboard + actions -->
    <div class="controls">
      <div class="input-display">
        <span
          v-for="i in gameStore.digitMode"
          :key="i"
          class="input-slot"
          :class="{ filled: gameStore.currentInput.length >= i }"
        >{{ gameStore.currentInput[i-1] || '_' }}</span>
      </div>

      <div class="keyboard">
        <button
          v-for="d in digits"
          :key="d"
          class="key"
          :disabled="!gameStore.isMyTurn || isKeyDisabled(d)"
          @click="gameStore.appendDigit(d)"
        >{{ d }}</button>
        <button class="key key-del" :disabled="!gameStore.isMyTurn" @click="gameStore.removeLastDigit()">⌫</button>
      </div>

      <div class="action-btns">
        <button
          class="btn-guess"
          :disabled="!gameStore.isMyTurn || gameStore.currentInput.length !== gameStore.digitMode"
          @click="gameStore.makeGuess()"
        >{{ t('game.send') }}</button>
        <button class="btn-resign" @click="handleResign">{{ t('game.resign') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useGameStore } from '../stores/game'
import { useAuthStore } from '../stores/auth'
import { t } from '../utils/locale.js'

export default {
  name: 'GameView',
  data() {
    return { showSecret: false, clockTimer: null }
  },
  computed: {
    ...mapStores(useGameStore, useAuthStore),
    digits() { return [1,2,3,4,5,6,7,8,9,0] },
    myClockMs() { return this.gameStore.myClockMs },
    opponentClockMs() { return this.gameStore.opponentClockMs },
    opponentUsername() { return this.gameStore.opponentUsername || 'Rakip' },
  },
  watch: {
    'gameStore.phase'(val) {
      if (val === 'ended') {
        this.$router.push(`/result/${this.gameStore.matchId}`)
      }
    }
  },
  mounted() {
    // Tick clocks locally every 100ms based on isMyTurn
    this.clockTimer = setInterval(() => {
      if (this.gameStore.phase !== 'playing') return
      if (this.gameStore.isMyTurn && this.gameStore.clockAMs != null) {
        if (this.gameStore.iAmPlayerA) {
          this.gameStore.clockAMs = Math.max(0, this.gameStore.clockAMs - 100)
        } else {
          this.gameStore.clockBMs = Math.max(0, this.gameStore.clockBMs - 100)
        }
      } else if (!this.gameStore.isMyTurn) {
        if (!this.gameStore.iAmPlayerA) {
          this.gameStore.clockAMs = Math.max(0, this.gameStore.clockAMs - 100)
        } else {
          this.gameStore.clockBMs = Math.max(0, this.gameStore.clockBMs - 100)
        }
      }
    }, 100)

    // Sync if no guesses loaded
    if (this.gameStore.matchId && this.gameStore.myGuesses.length === 0 && this.gameStore.opponentGuesses.length === 0) {
      setTimeout(() => {
        if (this.gameStore.stompClient?.active) {
          this.gameStore.stompClient.publish({
            destination: '/app/match.sync',
            body: JSON.stringify({ matchId: this.gameStore.matchId })
          })
        }
      }, 500)
    }
  },
  beforeUnmount() {
    clearInterval(this.clockTimer)
  },
  methods: {
    t,
    formatMs(ms) {
      if (ms == null) return '--:--'
      const total = Math.max(0, Math.ceil(ms / 1000))
      const m = Math.floor(total / 60)
      const s = total % 60
      return `${m}:${String(s).padStart(2, '0')}`
    },
    isKeyDisabled(d) {
      if (this.gameStore.currentInput.includes(String(d))) return true
      if (this.gameStore.currentInput.length === 0 && d === 0) return true
      if (this.gameStore.currentInput.length >= this.gameStore.digitMode) return true
      return false
    },
    handleResign() {
      if (confirm(t('game.resignConfirm'))) {
        this.gameStore.resign()
      }
    }
  }
}
</script>

<style scoped>
.game-view {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: var(--color-bg);
  overflow: hidden;
}
.players {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
}
.player-card {
  flex: 1;
  text-align: center;
  padding: 0.5rem;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.player-card.active {
  border-color: var(--color-accent);
}
.player-name {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.2rem;
}
.clock {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transition: color 0.3s;
}
.clock.low {
  color: var(--color-minus);
}
.vs {
  font-size: 0.75rem;
  opacity: 0.4;
  padding: 0 0.25rem;
}
.turn-indicator {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.85rem;
  opacity: 0.6;
  background: var(--color-bg);
}
.turn-indicator.myturn {
  color: var(--color-accent);
  opacity: 1;
  font-weight: 600;
}
.board {
  flex: 1;
  display: flex;
  gap: 0;
  overflow-y: auto;
  padding: 0.5rem;
}
.column {
  flex: 1;
  padding: 0 0.5rem;
}
.column-header {
  font-size: 0.75rem;
  opacity: 0.5;
  text-align: center;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.divider {
  width: 1px;
  background: var(--color-surface);
  align-self: stretch;
}
.guess-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
  padding: 0.3rem 0.4rem;
  border-radius: 6px;
  background: var(--color-surface);
  animation: slide-in 0.2s ease;
}
@keyframes slide-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.guess-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  flex: 1;
}
.plus { color: var(--color-plus); font-weight: 700; font-size: 0.85rem; }
.minus { color: var(--color-minus); font-weight: 700; font-size: 0.85rem; }
.zero { opacity: 0.4; font-size: 0.85rem; }
.my-secret {
  padding: 0.25rem 1rem;
  text-align: center;
}
.secret-toggle {
  background: transparent;
  border: none;
  color: var(--color-text);
  opacity: 0.5;
  font-size: 0.8rem;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.error-msg {
  text-align: center;
  color: var(--color-minus);
  font-size: 0.85rem;
  padding: 0.25rem;
  animation: fade 3s ease;
}
.controls {
  padding: 0.75rem;
  background: var(--color-surface);
  border-top: 1px solid var(--color-bg);
}
.input-display {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.input-slot {
  width: 44px;
  height: 52px;
  border: 2px solid var(--color-bg);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--color-bg);
}
.input-slot.filled {
  border-color: var(--color-accent);
}
.keyboard {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.key {
  padding: 0.9rem 0;
  border: none;
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.1s;
  min-height: 44px;
}
.key:disabled {
  opacity: 0.25;
  cursor: default;
}
.action-btns {
  display: flex;
  gap: 0.5rem;
}
.btn-guess {
  flex: 1;
  padding: 0.9rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-guess:disabled {
  opacity: 0.3;
}
.btn-resign {
  padding: 0.9rem 1rem;
  background: transparent;
  border: 1px solid var(--color-minus);
  color: var(--color-minus);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>

<template>
  <div class="detail-view">
    <header>
      <router-link to="/history" class="back-btn">← Geri</router-link>
      <h2>Maç Detayı</h2>
    </header>

    <div v-if="loading" class="loading">Yükleniyor...</div>

    <div v-else-if="match" class="content">
      <!-- Match meta -->
      <div class="meta-card">
        <div class="players-row">
          <span class="player-name">{{ match.playerAUsername }}</span>
          <span class="vs">vs</span>
          <span class="player-name">{{ match.playerBUsername }}</span>
        </div>
        <div class="match-info">
          {{ match.digitMode }} Basamak &middot; {{ tcLabel(match.timeControl) }}
          <span v-if="match.result"> &middot; {{ resultLabel(match.result) }}</span>
        </div>
        <div class="rating-changes" v-if="match.ratingChangeA != null">
          <span :class="match.ratingChangeA >= 0 ? 'positive' : 'negative'">
            {{ match.playerAUsername }}: {{ match.ratingChangeA >= 0 ? '+' : '' }}{{ match.ratingChangeA }}
          </span>
          &nbsp;/&nbsp;
          <span :class="match.ratingChangeB >= 0 ? 'positive' : 'negative'">
            {{ match.playerBUsername }}: {{ match.ratingChangeB >= 0 ? '+' : '' }}{{ match.ratingChangeB }}
          </span>
        </div>
      </div>

      <!-- Secrets -->
      <div class="secrets-row" v-if="match.secretA">
        <div class="secret-box">
          <div class="secret-label">{{ match.playerAUsername }}</div>
          <div class="secret-val">{{ match.secretA }}</div>
        </div>
        <div class="secret-box">
          <div class="secret-label">{{ match.playerBUsername }}</div>
          <div class="secret-val">{{ match.secretB }}</div>
        </div>
      </div>

      <!-- Guesses -->
      <div class="guesses-section">
        <div class="guesses-col">
          <div class="col-header">{{ match.playerAUsername }}</div>
          <div
            v-for="g in playerAGuesses"
            :key="g.guessNumber"
            class="guess-row"
            :class="{ solved: g.plus === match.digitMode }"
          >
            <span class="g-num">{{ g.guessNumber }}.</span>
            <span class="g-val">{{ g.value }}</span>
            <span class="plus">+{{ g.plus }}</span>
            <span class="minus">-{{ g.minus }}</span>
          </div>
        </div>
        <div class="col-divider"></div>
        <div class="guesses-col">
          <div class="col-header">{{ match.playerBUsername }}</div>
          <div
            v-for="g in playerBGuesses"
            :key="g.guessNumber"
            class="guess-row"
            :class="{ solved: g.plus === match.digitMode }"
          >
            <span class="g-num">{{ g.guessNumber }}.</span>
            <span class="g-val">{{ g.value }}</span>
            <span class="plus">+{{ g.plus }}</span>
            <span class="minus">-{{ g.minus }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../utils/api.js'
import { t } from '../utils/locale.js'

export default {
  name: 'MatchDetailView',
  data() {
    return { match: null, loading: true }
  },
  computed: {
    playerAGuesses() {
      return this.match?.guesses.filter(g => g.playerId === this.match.playerAId) || []
    },
    playerBGuesses() {
      return this.match?.guesses.filter(g => g.playerId === this.match.playerBId) || []
    }
  },
  async mounted() {
    try {
      this.match = await api.get(`/api/matches/${this.$route.params.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    t,
    resultLabel(r) {
      return r === 'A_WON' ? this.match.playerAUsername + ' kazandı'
           : r === 'B_WON' ? this.match.playerBUsername + ' kazandı'
           : 'Berabere'
    },
    tcLabel(tc) {
      return tc === 'FAST' ? 'Hızlı' : tc === 'NORMAL' ? 'Normal' : 'Uzun'
    }
  }
}
</script>

<style scoped>
.detail-view {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  background: var(--color-bg);
}
header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  margin-bottom: 1.5rem;
}
.back-btn { color: var(--color-text); text-decoration: none; opacity: 0.7; }
h2 { font-size: 1.2rem; font-weight: 700; }
.loading { text-align: center; padding: 3rem; opacity: 0.5; }
.content { display: flex; flex-direction: column; gap: 1rem; }
.meta-card {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}
.players-row { display: flex; justify-content: center; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.player-name { font-weight: 700; }
.vs { opacity: 0.4; font-size: 0.8rem; }
.match-info { font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.5rem; }
.rating-changes { font-size: 0.8rem; }
.positive { color: var(--color-plus); }
.negative { color: var(--color-minus); }
.secrets-row { display: flex; gap: 1rem; }
.secret-box { flex: 1; background: var(--color-surface); border-radius: 10px; padding: 0.75rem; text-align: center; }
.secret-label { font-size: 0.7rem; opacity: 0.6; margin-bottom: 0.25rem; }
.secret-val { font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.guesses-section { display: flex; gap: 0; }
.guesses-col { flex: 1; padding: 0 0.5rem; }
.col-header { font-size: 0.75rem; opacity: 0.5; text-align: center; margin-bottom: 0.5rem; text-transform: uppercase; }
.col-divider { width: 1px; background: var(--color-surface); }
.guess-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.4rem;
  border-radius: 6px;
  margin-bottom: 0.3rem;
  background: var(--color-surface);
  font-size: 0.85rem;
}
.guess-row.solved { background: color-mix(in srgb, var(--color-plus) 20%, transparent); }
.g-num { opacity: 0.4; font-size: 0.7rem; min-width: 14px; }
.g-val { font-weight: 700; font-variant-numeric: tabular-nums; flex: 1; }
.plus { color: var(--color-plus); font-size: 0.75rem; font-weight: 700; }
.minus { color: var(--color-minus); font-size: 0.75rem; font-weight: 700; }
</style>

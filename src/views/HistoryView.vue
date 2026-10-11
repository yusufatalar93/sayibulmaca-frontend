<template>
  <div class="history-view">
    <header>
      <router-link to="/" class="back-btn">← Geri</router-link>
      <h2>{{ t('home.matchHistory') }}</h2>
    </header>

    <div v-if="loading" class="loading">Yükleniyor...</div>

    <div v-else-if="matches.length === 0" class="empty">
      {{ t('history.noMatches') }}
    </div>

    <div v-else class="list">
      <router-link
        v-for="m in matches"
        :key="m.matchId"
        :to="`/matches/${m.matchId}`"
        class="history-item"
        :class="m.myResult"
      >
        <div class="item-left">
          <div class="opponent">{{ m.opponentUsername }}</div>
          <div class="meta">{{ m.digitMode }} Basamak &middot; {{ tcLabel(m.timeControl) }}</div>
        </div>
        <div class="item-right">
          <div class="result-badge" :class="m.myResult">{{ resultLabel(m.myResult) }}</div>
          <div class="rating-change" :class="m.myRatingChange >= 0 ? 'positive' : 'negative'" v-if="m.myRatingChange != null">
            {{ m.myRatingChange >= 0 ? '+' : '' }}{{ m.myRatingChange }}
          </div>
        </div>
      </router-link>
    </div>

    <button v-if="hasMore && !loading" class="load-more" @click="loadMore">Daha fazla</button>
  </div>
</template>

<script>
import { t } from '../utils/locale.js'
import api from '../utils/api.js'

export default {
  name: 'HistoryView',
  data() {
    return { matches: [], loading: true, page: 0, hasMore: true }
  },
  async mounted() {
    await this.loadMatches()
  },
  methods: {
    t,
    async loadMatches() {
      this.loading = true
      try {
        const data = await api.get(`/api/me/matches?page=${this.page}`)
        if (Array.isArray(data)) {
          this.matches.push(...data)
          this.hasMore = data.length === 20
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.loading = false
      }
    },
    async loadMore() {
      this.page++
      await this.loadMatches()
    },
    resultLabel(r) {
      return r === 'won' ? t('history.won') : r === 'lost' ? t('history.lost') : t('history.draw')
    },
    tcLabel(tc) {
      return tc === 'FAST' ? t('home.fast') : tc === 'NORMAL' ? t('home.normal') : t('home.long')
    }
  }
}
</script>

<style scoped>
.history-view {
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
.back-btn {
  color: var(--color-text);
  text-decoration: none;
  opacity: 0.7;
}
h2 { font-size: 1.2rem; font-weight: 700; }
.loading, .empty {
  text-align: center;
  padding: 3rem 0;
  opacity: 0.5;
}
.list { display: flex; flex-direction: column; gap: 0.5rem; }
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 10px;
  text-decoration: none;
  color: var(--color-text);
  border-left: 4px solid transparent;
  transition: opacity 0.1s;
}
.history-item.won  { border-left-color: var(--color-plus); }
.history-item.lost { border-left-color: var(--color-minus); }
.history-item.draw { border-left-color: var(--color-accent); }
.opponent { font-weight: 600; margin-bottom: 0.2rem; }
.meta { font-size: 0.75rem; opacity: 0.6; }
.item-right { text-align: right; }
.result-badge {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 0.2rem;
}
.result-badge.won  { color: var(--color-plus); }
.result-badge.lost { color: var(--color-minus); }
.result-badge.draw { color: var(--color-accent); }
.rating-change { font-size: 0.85rem; font-weight: 700; }
.rating-change.positive { color: var(--color-plus); }
.rating-change.negative { color: var(--color-minus); }
.load-more {
  display: block;
  margin: 1rem auto;
  padding: 0.75rem 2rem;
  background: transparent;
  border: 1px solid var(--color-text);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
}
</style>

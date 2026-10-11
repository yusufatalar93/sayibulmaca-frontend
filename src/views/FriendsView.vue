<template>
  <div class="friends-view">
    <header class="page-header">
      <button class="back-btn" @click="$router.push('/')">←</button>
      <h2>Arkadaşlar</h2>
    </header>

    <!-- Add friend -->
    <div class="section">
      <form class="add-form" @submit.prevent="handleSendRequest">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Kullanıcı adı veya e-posta"
          :disabled="addLoading"
        />
        <button type="submit" :disabled="addLoading || !searchInput.trim()">
          Ekle
        </button>
      </form>
      <div v-if="addError" class="error-msg">{{ addError }}</div>
      <div v-if="addSuccess" class="success-msg">{{ addSuccess }}</div>
    </div>

    <!-- Pending requests -->
    <div class="section" v-if="friendsStore.pendingRequests.length > 0">
      <h3>Bekleyen İstekler ({{ friendsStore.pendingRequests.length }})</h3>
      <div
        v-for="req in friendsStore.pendingRequests"
        :key="req.friendshipId"
        class="friend-row"
      >
        <div class="friend-info">
          <span class="friend-name">{{ req.username }}</span>
          <span class="badge pending">İstek gönderdi</span>
        </div>
        <div class="actions">
          <button class="btn-accept" @click="handleAccept(req.friendshipId)">Kabul</button>
          <button class="btn-decline" @click="handleDecline(req.friendshipId)">Reddet</button>
        </div>
      </div>
    </div>

    <!-- Friends list -->
    <div class="section">
      <h3>Arkadaşlar ({{ friendsStore.friends.length }})</h3>
      <div v-if="friendsStore.loading" class="loading-text">Yükleniyor...</div>
      <div v-else-if="friendsStore.friends.length === 0" class="empty-text">
        Henüz arkadaşın yok.
      </div>
      <div
        v-for="friend in friendsStore.friends"
        :key="friend.friendshipId"
        class="friend-row"
      >
        <div class="friend-info">
          <span class="online-dot" :class="{ online: friend.online }"></span>
          <span class="friend-name">{{ friend.username }}</span>
          <span class="badge online-badge" v-if="friend.online">Çevrimiçi</span>
        </div>
        <div class="actions">
          <button
            v-if="friend.online"
            class="btn-challenge"
            @click="openChallengeModal(friend)"
          >
            Oyna
          </button>
          <button class="btn-remove" @click="handleRemove(friend.friendshipId)">Sil</button>
        </div>
      </div>
    </div>

    <!-- Challenge modal -->
    <div class="modal-overlay" v-if="challengeTarget" @click.self="challengeTarget = null">
      <div class="modal">
        <h3>{{ challengeTarget.username }}'e Meydan Oku</h3>
        <div class="form-group">
          <label>Basamak Sayısı</label>
          <div class="btn-group">
            <button :class="{ active: challengeDigits === 4 }" @click="challengeDigits = 4">4 Basamak</button>
            <button :class="{ active: challengeDigits === 5 }" @click="challengeDigits = 5">5 Basamak</button>
          </div>
        </div>
        <div class="form-group">
          <label>Zaman Kontrolü</label>
          <div class="btn-group">
            <button :class="{ active: challengeTimeControl === 'FAST' }" @click="challengeTimeControl = 'FAST'">Hızlı</button>
            <button :class="{ active: challengeTimeControl === 'NORMAL' }" @click="challengeTimeControl = 'NORMAL'">Normal</button>
            <button :class="{ active: challengeTimeControl === 'LONG' }" @click="challengeTimeControl = 'LONG'">Uzun</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-send-challenge" @click="handleSendChallenge">Gönder</button>
          <button class="btn-cancel" @click="challengeTarget = null">İptal</button>
        </div>
      </div>
    </div>

    <!-- Incoming challenge notification -->
    <div class="challenge-banner" v-if="friendsStore.incomingChallenge">
      <div class="challenge-info">
        <strong>{{ friendsStore.incomingChallenge.challengerUsername }}</strong>
        sizi {{ friendsStore.incomingChallenge.digitMode }} basamaklı
        {{ timeControlLabel(friendsStore.incomingChallenge.timeControl) }} maca davet ediyor!
      </div>
      <div class="challenge-actions">
        <button class="btn-accept" @click="handleAcceptChallenge">Kabul Et</button>
        <button class="btn-decline" @click="handleDeclineChallenge">Reddet</button>
      </div>
    </div>

    <!-- Challenge sent notification -->
    <div class="challenge-banner sent" v-if="friendsStore.challengeSent && !friendsStore.incomingChallenge">
      <div class="challenge-info">
        <strong>{{ friendsStore.challengeSent.targetUsername }}</strong>'e davet gönderildi, yanıt bekleniyor...
      </div>
      <button class="btn-cancel-small" @click="friendsStore.clearChallengeSent()">İptal</button>
    </div>
  </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useFriendsStore } from '../stores/friends'
import { useGameStore } from '../stores/game'

export default {
  name: 'FriendsView',
  data() {
    return {
      searchInput: '',
      addLoading: false,
      addError: '',
      addSuccess: '',
      challengeTarget: null,
      challengeDigits: 4,
      challengeTimeControl: 'NORMAL',
    }
  },
  computed: {
    ...mapStores(useFriendsStore, useGameStore),
  },
  async created() {
    await Promise.all([
      this.friendsStore.loadFriends(),
      this.friendsStore.loadPendingRequests(),
    ])
  },
  methods: {
    async handleSendRequest() {
      this.addError = ''
      this.addSuccess = ''
      this.addLoading = true
      try {
        await this.friendsStore.sendRequest(this.searchInput.trim())
        this.addSuccess = 'Arkadaşlık isteği gönderildi!'
        this.searchInput = ''
      } catch (e) {
        this.addError = e.message
      } finally {
        this.addLoading = false
      }
    },
    async handleAccept(friendshipId) {
      await this.friendsStore.acceptRequest(friendshipId)
    },
    async handleDecline(friendshipId) {
      await this.friendsStore.declineRequest(friendshipId)
    },
    async handleRemove(friendshipId) {
      if (!confirm('Arkadaşlıktan çıkarmak istediğinize emin misiniz?')) return
      await this.friendsStore.removeFriend(friendshipId)
    },
    openChallengeModal(friend) {
      this.challengeTarget = friend
      this.challengeDigits = 4
      this.challengeTimeControl = 'NORMAL'
    },
    handleSendChallenge() {
      this.gameStore.sendChallenge(
        this.challengeTarget.username,
        this.challengeDigits,
        this.challengeTimeControl
      )
      this.challengeTarget = null
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
    timeControlLabel(tc) {
      return { FAST: 'Hızlı', NORMAL: 'Normal', LONG: 'Uzun' }[tc] || tc
    },
  },
}
</script>

<style scoped>
.friends-view {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--color-bg);
  padding-bottom: 6rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-bg);
}
.back-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--color-text);
}
.page-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.section {
  padding: 1rem;
  border-bottom: 1px solid var(--color-surface);
}
.section h3 {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.5;
}

.add-form {
  display: flex;
  gap: 0.5rem;
}
.add-form input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-surface);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.95rem;
}
.add-form button {
  padding: 0.6rem 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.add-form button:disabled {
  opacity: 0.4;
}

.friend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-bg);
}
.friend-row:last-child { border-bottom: none; }

.friend-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}
.online-dot.online { background: #4caf50; }
.friend-name { font-weight: 600; }
.badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--color-surface);
}
.online-badge { background: #e8f5e9; color: #2e7d32; }

.actions {
  display: flex;
  gap: 0.4rem;
}
.btn-accept {
  padding: 0.3rem 0.7rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-decline, .btn-remove {
  padding: 0.3rem 0.7rem;
  background: transparent;
  border: 1px solid var(--color-minus);
  color: var(--color-minus);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-challenge {
  padding: 0.3rem 0.7rem;
  background: var(--color-plus);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.error-msg { color: var(--color-minus); font-size: 0.85rem; margin-top: 0.5rem; }
.success-msg { color: #2e7d32; font-size: 0.85rem; margin-top: 0.5rem; }
.loading-text, .empty-text { opacity: 0.5; font-size: 0.9rem; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--color-surface);
  border-radius: 12px;
  padding: 1.5rem;
  width: 90%;
  max-width: 340px;
}
.modal h3 { margin: 0 0 1.25rem; font-size: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.8rem; opacity: 0.6; margin-bottom: 0.4rem; }
.btn-group { display: flex; gap: 0.4rem; }
.btn-group button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-bg);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-group button.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 700;
}
.modal-actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; }
.btn-send-challenge {
  flex: 1;
  padding: 0.75rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
.btn-cancel {
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid var(--color-surface);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text);
}

/* Challenge banner */
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
.challenge-banner.sent { border-color: var(--color-plus); opacity: 0.85; }
.challenge-info { margin-bottom: 0.75rem; font-size: 0.95rem; }
.challenge-actions { display: flex; gap: 0.5rem; }
.btn-cancel-small {
  font-size: 0.8rem;
  padding: 0.3rem 0.7rem;
  background: transparent;
  border: 1px solid var(--color-minus);
  color: var(--color-minus);
  border-radius: 6px;
  cursor: pointer;
}
</style>

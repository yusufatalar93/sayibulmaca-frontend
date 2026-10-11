import { defineStore } from 'pinia'
import api from '../utils/api'

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [],
    pendingRequests: [],
    incomingChallenge: null,  // { challengeId, challengerUsername, digitMode, timeControl }
    challengeSent: null,       // { challengeId, targetUsername }
    loading: false,
  }),

  getters: {
    onlineFriends: (state) => state.friends.filter(f => f.online),
    pendingCount: (state) => state.pendingRequests.length,
  },

  actions: {
    async loadFriends() {
      this.loading = true
      try {
        this.friends = await api.get('/api/friends')
      } finally {
        this.loading = false
      }
    },

    async loadPendingRequests() {
      this.pendingRequests = await api.get('/api/friends/requests')
    },

    async sendRequest(usernameOrEmail) {
      const result = await api.post('/api/friends/request', { usernameOrEmail })
      await this.loadFriends()
      return result
    },

    async acceptRequest(friendshipId) {
      await api.post(`/api/friends/${friendshipId}/accept`)
      await Promise.all([this.loadFriends(), this.loadPendingRequests()])
    },

    async declineRequest(friendshipId) {
      await api.post(`/api/friends/${friendshipId}/decline`)
      await this.loadPendingRequests()
    },

    async removeFriend(friendshipId) {
      await api.delete(`/api/friends/${friendshipId}`)
      this.friends = this.friends.filter(f => f.friendshipId !== friendshipId)
    },

    // Called from game store on WS messages
    onFriendRequestReceived(data) {
      this.pendingRequests.push({
        friendshipId: data.friendshipId,
        userId: data.userId,
        username: data.username,
        status: 'PENDING_RECEIVED',
        online: false,
      })
    },

    onFriendRequestAccepted(data) {
      // Reload friends list
      this.loadFriends()
    },

    setIncomingChallenge(data) {
      this.incomingChallenge = data
    },

    clearIncomingChallenge() {
      this.incomingChallenge = null
    },

    setChallengeSent(data) {
      this.challengeSent = data
    },

    clearChallengeSent() {
      this.challengeSent = null
    },
  }
})

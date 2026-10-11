import { defineStore } from 'pinia'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { auth } from '../firebase'
import { useAuthStore } from './auth'
import { useFriendsStore } from './friends'

export const useGameStore = defineStore('game', {
  state: () => ({
    stompClient: null,
    connected: false,

    // Pre-game selection
    selectedDigitMode: 4,
    selectedTimeControl: 'NORMAL',

    // Phase: null | 'queue' | 'secret' | 'playing' | 'ended'
    phase: null,
    matchId: null,
    iAmPlayerA: false,

    // Opponent info (from MATCH_FOUND)
    opponentUsername: null,
    opponentLeague: null,
    opponentTier: null,
    opponentRating: null,

    // Game details
    digitMode: null,
    timeControl: null,

    // Secret phase
    secretTimeoutAt: null,
    mySecret: null,

    // Playing phase
    isMyTurn: false,
    currentInput: '',
    myGuesses: [],       // [{value, plus, minus}]
    opponentGuesses: [], // [{value, plus, minus}]
    clockAMs: null,
    clockBMs: null,
    finalTurnActive: false,
    playerAId: null,
    playerBId: null,

    // Ended
    matchResult: null,   // 'won' | 'lost' | 'draw'
    endReason: null,
    opponentSecret: null,
    myRatingChange: null,
    newRating: null,
    newLeague: null,
    newTier: null,

    // Queue
    queueStartedAt: null,

    lastError: null,
  }),

  getters: {
    myClockMs: (state) => state.iAmPlayerA ? state.clockAMs : state.clockBMs,
    opponentClockMs: (state) => state.iAmPlayerA ? state.clockBMs : state.clockAMs,
    usedDigits: (state) => state.currentInput.split('').map(Number),
  },

  actions: {
    async connect() {
      if (this.stompClient?.active) return

      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const self = this
      const client = new Client({
        webSocketFactory: () => new SockJS((import.meta.env.VITE_API_URL || '') + '/ws'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect() {
          self.connected = true
          client.subscribe('/user/queue/game', (msg) => {
            try {
              self.handleMessage(JSON.parse(msg.body))
            } catch (e) {
              console.error('WS parse error', e)
            }
          })
          // Reconnect sync
          if (self.matchId && self.phase !== 'ended' && self.phase !== null) {
            client.publish({
              destination: '/app/match.sync',
              body: JSON.stringify({ matchId: self.matchId })
            })
          }
        },
        onDisconnect() {
          self.connected = false
        },
        onStompError(frame) {
          console.error('STOMP error', frame)
        },
        reconnectDelay: 5000,
      })

      this.stompClient = client
      client.activate()
    },

    disconnect() {
      this.stompClient?.deactivate()
      this.stompClient = null
      this.connected = false
    },

    handleMessage(message) {
      const { type, data } = message
      switch (type) {
        case 'QUEUE_STATUS':   this.onQueueStatus(data); break
        case 'MATCH_FOUND':    this.onMatchFound(data); break
        case 'SECRET_PHASE':   this.onSecretPhase(data); break
        case 'MATCH_STARTED':  this.onMatchStarted(data); break
        case 'GUESS_RESULT':   this.onGuessResult(data); break
        case 'GUESS_REJECTED': this.onGuessRejected(data); break
        case 'FINAL_TURN':     this.onFinalTurn(data); break
        case 'MATCH_ENDED':      this.onMatchEnded(data); break
        case 'MATCH_STATE':      this.onMatchState(data); break
        case 'SECRET_ASSIGNED':          this.mySecret = data.secret; break
        case 'CHALLENGE_RECEIVED':       useFriendsStore().setIncomingChallenge(data); break
        case 'CHALLENGE_SENT':           useFriendsStore().setChallengeSent(data); break
        case 'CHALLENGE_ACCEPTED':       break  // MATCH_FOUND will follow
        case 'CHALLENGE_DECLINED':       useFriendsStore().clearChallengeSent(); break
        case 'CHALLENGE_EXPIRED':        useFriendsStore().clearIncomingChallenge(); useFriendsStore().clearChallengeSent(); break
        case 'FRIEND_REQUEST_RECEIVED':  useFriendsStore().onFriendRequestReceived(data); break
        case 'FRIEND_REQUEST_ACCEPTED':  useFriendsStore().onFriendRequestAccepted(data); break
        default: console.warn('Unknown message type:', type)
      }
    },

    onQueueStatus(data) {
      // UI can read queueStartedAt for display
    },

    onMatchFound(data) {
      this.matchId = data.matchId
      this.iAmPlayerA = data.iAmPlayerA
      this.opponentUsername = data.opponentUsername
      this.opponentLeague = data.opponentLeague
      this.opponentTier = data.opponentTier
      this.opponentRating = data.opponentRating
      this.digitMode = data.digitMode
      this.timeControl = data.timeControl
    },

    onSecretPhase(data) {
      this.phase = 'secret'
      this.secretTimeoutAt = Date.now() + data.timeoutSeconds * 1000
    },

    onMatchStarted(data) {
      this.phase = 'playing'
      this.playerAId = data.playerAId
      this.playerBId = data.playerBId
      this.clockAMs = data.clockAMs
      this.clockBMs = data.clockBMs
      const authStore = useAuthStore()
      const myId = authStore.user?.id?.toString()
      this.iAmPlayerA = data.playerAId === myId
      this.isMyTurn = data.currentTurnPlayerId === myId
    },

    onGuessResult(data) {
      const authStore = useAuthStore()
      const myId = authStore.user?.id?.toString()
      const isMyGuess = data.guesserId === myId

      const entry = { value: data.value, plus: data.plus, minus: data.minus }
      if (isMyGuess) {
        this.myGuesses.push(entry)
      } else {
        this.opponentGuesses.push(entry)
      }

      this.clockAMs = data.clockAMs
      this.clockBMs = data.clockBMs

      if (data.currentTurnPlayerId) {
        this.isMyTurn = data.currentTurnPlayerId === myId
      }
    },

    onGuessRejected(data) {
      this.lastError = data.reason || 'Tahmin reddedildi'
      setTimeout(() => { this.lastError = null }, 3000)
    },

    onFinalTurn(data) {
      this.finalTurnActive = true
    },

    onMatchEnded(data) {
      this.phase = 'ended'
      this.matchResult = data.result
      this.endReason = data.endReason
      this.opponentSecret = data.opponentSecret
      this.myRatingChange = data.myRatingChange
      this.newRating = data.newRating
      this.newLeague = data.newLeague
      this.newTier = data.newTier

      // Update auth store with new rating
      const authStore = useAuthStore()
      if (authStore.user && data.newRating != null) {
        const rating = authStore.user.ratings?.find(r => r.digitMode === this.digitMode)
        if (rating) {
          rating.rating = data.newRating
          rating.league = data.newLeague
          rating.tier = data.newTier
        }
      }
    },

    onMatchState(data) {
      const authStore = useAuthStore()
      const myId = authStore.user?.id?.toString()

      this.matchId = data.matchId
      this.iAmPlayerA = data.iAmPlayerA
      this.playerAId = data.playerAId
      this.playerBId = data.playerBId
      this.clockAMs = data.clockAMs
      this.clockBMs = data.clockBMs
      this.myGuesses = data.myGuesses || []
      this.opponentGuesses = data.opponentGuesses || []
      this.finalTurnActive = data.finalTurnActive || false

      if (data.mySecret) {
        this.mySecret = data.mySecret
      }

      if (data.status === 'SETUP') {
        this.phase = 'secret'
      } else if (data.status === 'IN_PROGRESS') {
        this.phase = 'playing'
        this.isMyTurn = data.currentTurnPlayerId === myId
      }
    },

    // ── Actions ──────────────────────────────────────────────────────────────

    joinQueue(digitMode, timeControl) {
      if (!this.stompClient?.active) return
      this.phase = 'queue'
      this.queueStartedAt = Date.now()
      this.myGuesses = []
      this.opponentGuesses = []
      this.currentInput = ''
      this.finalTurnActive = false
      this.stompClient.publish({
        destination: '/app/queue.join',
        body: JSON.stringify({ digitMode, timeControl })
      })
    },

    sendChallenge(targetUsername, digitMode, timeControl) {
      this.stompClient?.publish({
        destination: '/app/challenge.send',
        body: JSON.stringify({ targetUsername, digitMode, timeControl })
      })
    },

    acceptChallenge(challengeId) {
      this.resetForNewGame()
      this.stompClient?.publish({
        destination: '/app/challenge.accept',
        body: JSON.stringify({ challengeId })
      })
    },

    declineChallenge(challengeId) {
      this.stompClient?.publish({
        destination: '/app/challenge.decline',
        body: JSON.stringify({ challengeId })
      })
    },

    leaveQueue() {
      this.stompClient?.publish({ destination: '/app/queue.leave', body: '{}' })
      this.phase = null
      this.queueStartedAt = null
    },

    setSecret(secret) {
      this.mySecret = secret
      this.stompClient?.publish({
        destination: '/app/match.setSecret',
        body: JSON.stringify({ matchId: this.matchId, secret })
      })
    },

    autoAssignSecret() {
      this.stompClient?.publish({
        destination: '/app/match.setSecret',
        body: JSON.stringify({ matchId: this.matchId, auto: true })
      })
    },

    makeGuess() {
      if (!this.currentInput || this.currentInput.length !== this.digitMode) return
      const value = this.currentInput
      this.currentInput = ''
      this.stompClient?.publish({
        destination: '/app/match.guess',
        body: JSON.stringify({ matchId: this.matchId, value })
      })
    },

    resign() {
      this.stompClient?.publish({
        destination: '/app/match.resign',
        body: JSON.stringify({ matchId: this.matchId })
      })
    },

    appendDigit(digit) {
      if (!this.isMyTurn) return
      if (this.currentInput.includes(String(digit))) return
      if (this.currentInput.length === 0 && digit === 0) return
      if (this.currentInput.length >= this.digitMode) return
      this.currentInput += String(digit)
    },

    removeLastDigit() {
      this.currentInput = this.currentInput.slice(0, -1)
    },

    resetForNewGame() {
      this.phase = null
      this.matchId = null
      this.myGuesses = []
      this.opponentGuesses = []
      this.currentInput = ''
      this.finalTurnActive = false
      this.matchResult = null
      this.endReason = null
      this.opponentSecret = null
      this.myRatingChange = null
      this.newRating = null
      this.newLeague = null
      this.newTier = null
      this.lastError = null
      this.mySecret = null
    },
  }
})

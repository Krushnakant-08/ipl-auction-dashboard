/**
 * API helper functions for making requests to the auction backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export const api = {
  // Teams
  async getTeams() {
    const res = await fetch(`${API_BASE_URL}/api/teams`)
    return res.json()
  },
  
  async updateTeam(team: any) {
    const res = await fetch(`${API_BASE_URL}/api/teams`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team),
    })
    return res.json()
  },
  
  // Players
  async getPlayers() {
    const res = await fetch(`${API_BASE_URL}/api/players`)
    return res.json()
  },
  
  async updatePlayer(player: any) {
    const res = await fetch(`${API_BASE_URL}/api/players`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
    })
    return res.json()
  },
  
  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE_URL}/api/settings`)
    return res.json()
  },
  
  async updateSettings(settings: any) {
    const res = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return res.json()
  },
  
  // Transactions
  async getTransactions() {
    const res = await fetch(`${API_BASE_URL}/api/transactions`)
    return res.json()
  },
  
  async addTransaction(transaction: any) {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    })
    return res.json()
  },
  
  // Trades
  async getTrades() {
    const res = await fetch(`${API_BASE_URL}/api/trades`)
    return res.json()
  },
  
  async createTrade(trade: any) {
    const res = await fetch(`${API_BASE_URL}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade),
    })
    return res.json()
  },
  
  async updateTrade(trade: any) {
    const res = await fetch(`${API_BASE_URL}/api/trades`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade),
    })
    return res.json()
  },
  
  // Complete auction state
  async getAuctionState() {
    const res = await fetch(`${API_BASE_URL}/api/auction`)
    return res.json()
  },
  
  async saveAuctionState(state: any) {
    const res = await fetch(`${API_BASE_URL}/api/auction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    return res.json()
  },
  
  // Initialize database
  async initializeDatabase() {
    const res = await fetch(`${API_BASE_URL}/api/init`, {
      method: 'POST',
    })
    return res.json()
  },
  
  async clearDatabase() {
    const res = await fetch(`${API_BASE_URL}/api/init`, {
      method: 'DELETE',
    })
    return res.json()
  },
}

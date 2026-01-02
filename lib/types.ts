export type PlayerRole = "Batsman" | "Bowler" | "All-rounder" | "Wk/Batsman"
export type PlayerStatus = "Unsold" | "Sold"
export type AuctionPhase = "Team Auction" | "Player Auction" | "Trading Window" | "Finalization"
export type UserRole = "admin" | "franchise"
export type TradeStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled"

export interface User {
  id: string
  role: UserRole
  name: string
  teamId?: string // Only for franchise users
}

export interface Player {
  id: string
  name: string
  role: PlayerRole
  basePrice: number // Starting auction price in Cr
  country: string // Player's nationality
  originalTeam: string | null // Original franchise they belonged to
  currentTeam: string | null // Current owner
  purchasePrice: number | null
  status: PlayerStatus
}

export interface Team {
  id: string
  groupName: string // Participating group name
  franchiseName: string | null // Won franchise name
  franchiseBid: number // Amount bid for franchise
  remainingBudget: number // 100 - franchiseBid
  logo: string
  squadPlayerIds: string[]
  rtmUsed: boolean
  rtsUsed: boolean
  teamAuctionComplete: boolean
}

export interface AuctionTransaction {
  id: string
  playerId: string
  playerName: string
  soldPrice: number
  soldToTeam: string
  soldToTeamName: string
  timestamp: Date
  rtmUsedBy: string | null
  rtsUsedBy: string | null
  type: "sale" | "rtm" | "rts"
}

export interface AuctionSettings {
  initialBudget: number
  minSquadSize: number
  maxSquadSize: number
  currentPhase: AuctionPhase
  tradingWindowEnd?: Date | null
}

export interface Trade {
  id: string
  proposedBy: string // team ID
  proposedByName: string
  proposedTo: string // team ID
  proposedToName: string
  offeredPlayers: string[] // player IDs from proposing team
  offeredPlayerNames: string[] // player names from proposing team
  requestedPlayers: string[] // player IDs from target team
  requestedPlayerNames: string[] // player names from target team
  status: TradeStatus
  proposedAt: Date
  respondedAt?: Date | null
  message?: string
}

export interface FinalEleven {
  teamId: string
  powerplay: string[] // 2 players
  middleOvers: string[] // 2 players
  deathOvers: string[] // 2 players
  remaining: string[] // 5 players
}

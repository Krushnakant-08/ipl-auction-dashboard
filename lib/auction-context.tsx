"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type { Team, Player, AuctionSettings, AuctionTransaction, Trade } from "./types"
import { mockTeams, mockPlayers, defaultSettings, availableFranchises } from "./mock-data"
import { useToast } from "@/hooks/use-toast"
import { AuctionWebSocket } from "./websocket"

const mockOriginalTeamMap = new Map<string, string | null>(
  mockPlayers.map((player) => [player.id, player.originalTeam ?? null]),
)

const enforceOriginalTeam = (incoming: Player[]): Player[] =>
  incoming.map((player) => ({
    ...player,
    originalTeam: mockOriginalTeamMap.get(player.id) ?? player.originalTeam ?? null,
  }))

interface AuctionContextType {
  settings: AuctionSettings
  teams: Team[]
  players: Player[]
  transactions: AuctionTransaction[]
  trades: Trade[]
  availableFranchises: typeof availableFranchises

  // Team Auction
  assignFranchise: (teamId: string, franchiseId: string, bidAmount: number) => Promise<boolean>
  canStartPlayerAuction: () => boolean
  startPlayerAuction: () => Promise<void>

  // Player Auction
  sellPlayer: (playerId: string, teamId: string, price: number) => Promise<boolean>

  // Trading Window
  startTradingWindow: (durationMinutes: number) => Promise<void>
  endTradingWindow: () => Promise<void>
  proposeTrade: (proposedBy: string, proposedTo: string, offeredPlayers: string[], requestedPlayers: string[], message?: string) => Promise<boolean>
  respondToTrade: (tradeId: string, accept: boolean) => Promise<boolean>
  cancelTrade: (tradeId: string, teamId: string) => Promise<boolean>
  // approveTrade: (tradeId: string, approve: boolean) => Promise<boolean>

  // RTM
  useRTM: (playerId: string, originalTeamId: string) => Promise<boolean>
  canUseRTM: (playerId: string, teamId: string) => { can: boolean; reason: string }

  // RTS
  useRTS: (playerId: string, teamId: string) => Promise<boolean>
  canUseRTS: (teamId: string) => { can: boolean; reason?: string }

  // Utilities
  getTeamById: (teamId: string) => Team | undefined
  getPlayerById: (playerId: string) => Player | undefined
  getTeamPlayers: (teamId: string) => Player[]
  resetAuction: () => void
  undoLastTransaction: () => void
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined)

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<AuctionSettings>(defaultSettings)
  const [teams, setTeams] = useState<Team[]>(mockTeams)
  const [players, setPlayers] = useState<Player[]>(() => enforceOriginalTeam(mockPlayers))
  const [transactions, setTransactions] = useState<AuctionTransaction[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const wsRef = useRef<AuctionWebSocket | null>(null)
  const isSavingRef = useRef(false)
  const isCleaningUpRef = useRef(false)

  // Load initial state from server on mount
  useEffect(() => {
    const loadFromServer = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime()
        const response = await fetch(`/api/auction?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
        const data = await response.json()
        
        console.log('📥 Loading from database:', {
          settings: data.settings?.initialBudget,
          teams: data.teams?.length,
          players: data.players?.length,
        })
        
        if (data.settings) setSettings(data.settings)
        if (data.teams) setTeams(data.teams)
        if (data.players) setPlayers(enforceOriginalTeam(data.players))
        if (data.transactions) setTransactions(data.transactions)
        if (data.trades) setTrades(data.trades)
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to load auction state:', error)
        setIsInitialized(true)
      }
    }

    loadFromServer()
  }, [])

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!isInitialized) return

    // Don't create new WebSocket if one already exists
    if (!wsRef.current) {
      wsRef.current = new AuctionWebSocket()
      
      wsRef.current.connect((data) => {
        // Update state when receiving updates from server
        if (!isSavingRef.current && !isCleaningUpRef.current) {
          if (data.settings) setSettings(data.settings)
          if (data.teams) setTeams(data.teams)
          if (data.players) setPlayers(enforceOriginalTeam(data.players))
          if (data.transactions) setTransactions(data.transactions)
          if (data.trades) setTrades(data.trades)
        }
      })
    }

    return () => {
      // Mark as cleaning up to prevent state updates during unmount
      isCleaningUpRef.current = true
      
      // Only disconnect when component actually unmounts
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
      }
    }
  }, [isInitialized])

  // Save to server whenever state changes (debounced) - DISABLED for explicit DB updates
  // Settings changes are saved immediately via API calls in specific functions
  useEffect(() => {
    if (!isInitialized) return

    // Only auto-save settings phase changes
    const saveSettingsChanges = async () => {
      try {
        isSavingRef.current = true
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        })
        isSavingRef.current = false
      } catch (error) {
        console.error('Failed to save settings:', error)
        isSavingRef.current = false
      }
    }

    // Only save when phase changes (not on every state update)
    const timeoutId = setTimeout(saveSettingsChanges, 500)
    return () => clearTimeout(timeoutId)
  }, [settings.currentPhase, settings.tradingWindowEnd, isInitialized])

  const getTeamById = useCallback((teamId: string) => teams.find((t) => t.id === teamId), [teams])
  const getPlayerById = useCallback((playerId: string) => players.find((p) => p.id === playerId), [players])
  const getTeamPlayers = useCallback((teamId: string) => players.filter((p) => p.currentTeam === teamId), [players])

  // Helper function to broadcast updates to all clients
  const broadcastUpdate = useCallback(async (preFetchedData?: {
    teams?: Team[]
    players?: Player[]
    transactions?: AuctionTransaction[]
    trades?: Trade[]
    settings?: AuctionSettings
  }) => {
    try {
      // Use pre-fetched data if available, otherwise fetch from database
      let freshTeams: Team[]
      let freshPlayers: Player[]
      let freshTransactions: AuctionTransaction[]
      let freshTrades: Trade[]
      let freshSettings: AuctionSettings

      if (preFetchedData?.teams && preFetchedData?.players && preFetchedData?.transactions && preFetchedData?.trades && preFetchedData?.settings) {
        // Use all pre-fetched data
        freshTeams = preFetchedData.teams
        freshPlayers = preFetchedData.players
        freshTransactions = preFetchedData.transactions
        freshTrades = preFetchedData.trades
        freshSettings = preFetchedData.settings
      } else {
        // Fetch only what's missing
        const fetchPromises: Promise<Response>[] = []
        const fetchTypes: string[] = []

        if (!preFetchedData?.teams) {
          fetchPromises.push(fetch('/api/teams', { cache: 'no-store' }))
          fetchTypes.push('teams')
        }
        if (!preFetchedData?.players) {
          fetchPromises.push(fetch('/api/players', { cache: 'no-store' }))
          fetchTypes.push('players')
        }
        if (!preFetchedData?.transactions) {
          fetchPromises.push(fetch('/api/transactions', { cache: 'no-store' }))
          fetchTypes.push('transactions')
        }
        if (!preFetchedData?.trades) {
          fetchPromises.push(fetch('/api/trades', { cache: 'no-store' }))
          fetchTypes.push('trades')
        }
        if (!preFetchedData?.settings) {
          fetchPromises.push(fetch('/api/settings', { cache: 'no-store' }))
          fetchTypes.push('settings')
        }

        const responses = await Promise.all(fetchPromises)
        const fetchedData = await Promise.all(responses.map(r => r.json()))

        // Map fetched data back
        let dataIndex = 0
        freshTeams = preFetchedData?.teams ?? (fetchTypes[dataIndex] === 'teams' ? fetchedData[dataIndex++] : teams)
        freshPlayers = preFetchedData?.players ?? (fetchTypes[dataIndex] === 'players' ? fetchedData[dataIndex++] : players)
        freshTransactions = preFetchedData?.transactions ?? (fetchTypes[dataIndex] === 'transactions' ? fetchedData[dataIndex++] : transactions)
        freshTrades = preFetchedData?.trades ?? (fetchTypes[dataIndex] === 'trades' ? fetchedData[dataIndex++] : trades)
        freshSettings = preFetchedData?.settings ?? (fetchTypes[dataIndex] === 'settings' ? fetchedData[dataIndex++] : settings)
      }

      // Broadcast to WebSocket
      await fetch('/api/auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: freshSettings,
          teams: freshTeams,
          players: freshPlayers,
          transactions: freshTransactions,
          trades: freshTrades,
        }),
      })
    } catch (error) {
      console.error('Failed to broadcast update:', error)
    }
  }, [teams, players, transactions, trades, settings])

  // Team Auction: Assign franchise to team
  const assignFranchise = useCallback(
    async (teamId: string, franchiseId: string, bidAmount: number) => {
      console.log('🎯 assignFranchise called:', { teamId, franchiseId, bidAmount })
      
      const franchise = availableFranchises.find((f) => f.id === franchiseId)

      if (!franchise) {
        toast({ title: "Error", description: "Franchise not found", variant: "destructive" })
        return false
      }

      if (bidAmount < 0 || bidAmount > settings.initialBudget) {
        toast({
          title: "Invalid Bid",
          description: `Bid must be between 0 and ${settings.initialBudget} Cr`,
          variant: "destructive",
        })
        return false
      }

      console.log('📥 Fetching fresh team data from database')
      
      try {
        // Fetch fresh team and teams data from database to ensure we have latest budget
        const timestamp = Date.now()
        const [teamResponse, teamsResponse] = await Promise.all([
          fetch(`/api/teams?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }),
          fetch(`/api/teams?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          })
        ])

        if (!teamResponse.ok || !teamsResponse.ok) {
          throw new Error('Failed to fetch team data from database')
        }

        const freshTeams = await teamsResponse.json()
        const team = freshTeams.find((t: Team) => t.id === teamId)

        console.log('Found team with fresh data:', team)
        console.log('Found franchise:', franchise)

        if (!team) {
          toast({ title: "Error", description: "Team not found in database", variant: "destructive" })
          return false
        }

        // Check if franchise already taken
        const franchiseTaken = freshTeams.some((t: Team) => t.franchiseName === franchise.name && t.id !== teamId)
        console.log('Franchise taken?', franchiseTaken)
        
        if (franchiseTaken) {
          toast({ title: "Franchise Taken", description: "This franchise is already assigned", variant: "destructive" })
          return false
        }

        console.log('✅ Assigning franchise to team')
        
        // Calculate new remaining budget using fresh data
        const newRemainingBudget = team.remainingBudget - bidAmount
        
        if (newRemainingBudget < 0) {
          toast({ title: "Insufficient Budget", description: "Not enough budget available", variant: "destructive" })
          return false
        }

        // Update database immediately
        const updatedTeam = {
          ...team,
          franchiseName: franchise.name,
          franchiseBid: bidAmount,
          remainingBudget: newRemainingBudget,
          logo: franchise.logo,
          teamAuctionComplete: true,
        }

        console.log('📤 Sending team update to database:', { id: updatedTeam.id, franchiseName: updatedTeam.franchiseName })

        const updateResponse = await fetch('/api/teams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTeam),
        })

        console.log('📥 Update response status:', updateResponse.status)

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text()
          console.error('❌ Update failed:', errorText)
          throw new Error(`Failed to update team in database: ${errorText}`)
        }

        const savedTeam = await updateResponse.json()
        console.log('✅ Team updated in database:', savedTeam)

        // Update local state with fresh teams data including the saved team
        const updatedTeams = freshTeams.map((t: Team) => t.id === teamId ? savedTeam : t)
        setTeams(updatedTeams)

        // Broadcast update to all connected clients with just the updated team data
        console.log('📡 Broadcasting update to all clients...')
        await broadcastUpdate({
          teams: updatedTeams,
          players: players,
          transactions: transactions,
          trades: trades,
          settings: settings,
        })
        console.log('✅ Broadcast completed')

        toast({
          title: "Franchise Assigned!",
          description: `${team.groupName} won ${franchise.name} for ₹${bidAmount} Cr`,
        })

        return true
      } catch (error) {
        console.error('❌ Error assigning franchise:', error)
        console.error('Error details:', error instanceof Error ? error.message : String(error))
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack')
        toast({ 
          title: "Error", 
          description: `Failed to assign franchise: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          variant: "destructive" 
        })
        return false
      }
    },
    [getTeamById, teams, settings, toast, broadcastUpdate],
  )

  const canStartPlayerAuction = useCallback(() => {
    return teams.every((t) => t.teamAuctionComplete)
  }, [teams])

  const startPlayerAuction = useCallback(async () => {
    try {
      console.log('🎬 Starting player auction - current phase:', settings.currentPhase)
      
      // Fetch fresh team data from database to ensure we have the latest budgets
      const timestamp = Date.now()
      const freshTeamsResponse = await fetch(`/api/teams?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      })
      
      if (!freshTeamsResponse.ok) {
        throw new Error('Failed to fetch teams from database')
      }
      
      const freshTeams = await freshTeamsResponse.json()
      console.log('📥 Fetched fresh teams from database:', freshTeams.length)
      
      // Auto-complete teams that have franchises assigned but not marked complete
      const updatedTeams = freshTeams.map((t: Team) => 
        t.franchiseName && !t.teamAuctionComplete 
          ? { ...t, teamAuctionComplete: true } 
          : t
      )

      // Update teams in database if any changed
      const teamsToUpdate = updatedTeams.filter((t: Team, i: number) => 
        t.teamAuctionComplete !== freshTeams[i].teamAuctionComplete
      )
      
      if (teamsToUpdate.length > 0) {
        console.log(`📤 Updating ${teamsToUpdate.length} teams in database`)
        await Promise.all(
          teamsToUpdate.map((team: any) =>
            fetch('/api/teams', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(team),
            })
          )
        )
      }

      // Update settings in database
      const newSettings: AuctionSettings = { 
        initialBudget: settings.initialBudget,
        minSquadSize: settings.minSquadSize,
        maxSquadSize: settings.maxSquadSize,
        currentPhase: "Player Auction",
        tradingWindowEnd: settings.tradingWindowEnd,
      }
      
      console.log('📤 Updating settings to Player Auction phase')
      const settingsResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text()
        console.error('❌ Settings update failed:', settingsResponse.status, errorText)
        throw new Error(`Failed to update settings in database: ${errorText}`)
      }

      const savedSettings = await settingsResponse.json()
      console.log('✅ Player auction started - Phase updated in database:', savedSettings)

      // Update local state
      setTeams(updatedTeams)
      setSettings(savedSettings)

      // Broadcast update to all clients (non-blocking)
      broadcastUpdate({
        teams: updatedTeams,
        players: players,
        transactions: transactions,
        trades: trades,
        settings: savedSettings,
      }).catch(err => console.error('Broadcast failed:', err))
      
      toast({
        title: "Player Auction Started!",
        description: "Teams can now bid for players",
      })
    } catch (error) {
      console.error('❌ Error starting player auction:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      toast({ title: "Error", description: "Failed to start player auction", variant: "destructive" })
    }
  }, [teams, settings, toast, broadcastUpdate])

  // Player Auction: Sell player to team
  const sellPlayer = useCallback(
    async (playerId: string, teamId: string, price: number) => {
      const player = getPlayerById(playerId)
      const team = getTeamById(teamId)

      if (!player || !team) {
        toast({ title: "Error", description: "Player or team not found", variant: "destructive" })
        return false
      }

      if (settings.currentPhase !== "Player Auction") {
        toast({
          title: "Player Auction Not Active",
          description: "Complete team auction first",
          variant: "destructive",
        })
        return false
      }

      if (player.status === "Sold") {
        toast({ title: "Error", description: "Player already sold", variant: "destructive" })
        return false
      }

      if (price > team.remainingBudget) {
        toast({
          title: "Insufficient Budget",
          description: `${team.franchiseName || team.groupName} only has ₹${team.remainingBudget} Cr remaining`,
          variant: "destructive",
        })
        return false
      }

      const squadSize = team.squadPlayerIds.length
      if (squadSize >= settings.maxSquadSize) {
        toast({
          title: "Squad Full",
          description: `Maximum squad size is ${settings.maxSquadSize} players`,
          variant: "destructive",
        })
        return false
      }

      try {
        // Fetch teams and players in parallel for faster verification
        const timestamp = Date.now()
        const [dbTeamResponse, dbPlayerResponse] = await Promise.all([
          fetch(`/api/teams?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          }),
          fetch(`/api/players?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          })
        ])
        
        if (!dbTeamResponse.ok || !dbPlayerResponse.ok) {
          toast({ 
            title: "Database Error", 
            description: "Failed to connect to database", 
            variant: "destructive" 
          })
          return false
        }
        
        const [dbTeams, dbPlayers] = await Promise.all([
          dbTeamResponse.json(),
          dbPlayerResponse.json()
        ])
        
        if (!Array.isArray(dbTeams) || dbTeams.length === 0) {
          toast({ 
            title: "Database Not Initialized", 
            description: "No teams found. Please initialize the database first.", 
            variant: "destructive" 
          })
          return false
        }
        
        const dbTeam = dbTeams.find((t: any) => t.id === teamId)
        
        if (!dbTeam) {
          toast({ 
            title: "Team Not Found", 
            description: `Team ${teamId} not found in database.`, 
            variant: "destructive" 
          })
          return false
        }

        const dbPlayer = dbPlayers.find((p: any) => p.id === playerId)
        
        if (!dbPlayer) {
          toast({ title: "Error", description: "Player not found in database", variant: "destructive" })
          return false
        }

        if (dbPlayer.status === 'Sold') {
          toast({ title: "Error", description: "Player already sold in database", variant: "destructive" })
          return false
        }

        // Verify budget availability
        if (price > dbTeam.remainingBudget) {
          toast({
            title: "Insufficient Budget",
            description: `Only ₹${dbTeam.remainingBudget} Cr remaining in database`,
            variant: "destructive",
          })
          return false
        }

        // Calculate new values
        const newRemainingBudget = dbTeam.remainingBudget - price
        const newSquadPlayerIds = [...(dbTeam.squadPlayerIds || []), playerId]

        // Prepare updated player and team objects
        const updatedPlayer = {
          ...dbPlayer,
          status: 'Sold',
          currentTeam: teamId,
          currentTeamName: team.franchiseName || team.groupName,
          purchasePrice: price,
          originalTeam: dbPlayer.originalTeam ?? mockOriginalTeamMap.get(playerId) ?? null,
        }

        const updatedTeam = {
          ...dbTeam,
          remainingBudget: newRemainingBudget,
          squadPlayerIds: newSquadPlayerIds,
        }

        // Update player and team in database in parallel
        const [playerUpdateResponse, teamUpdateResponse] = await Promise.all([
          fetch('/api/players', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlayer),
          }),
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTeam),
          })
        ])

        if (!playerUpdateResponse.ok || !teamUpdateResponse.ok) {
          throw new Error('Failed to update player or team in database')
        }

        const [savedPlayer, savedTeam] = await Promise.all([
          playerUpdateResponse.json(),
          teamUpdateResponse.json()
        ])

        // Create transaction record
        const transaction: AuctionTransaction = {
          id: `txn-${Date.now()}`,
          playerId,
          playerName: player.name,
          soldPrice: price,
          soldToTeam: teamId,
          soldToTeamName: team.franchiseName || team.groupName,
          timestamp: new Date(),
          rtmUsedBy: null,
          rtsUsedBy: null,
          type: "sale",
        }

        // Save transaction asynchronously (don't wait)
        fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        }).catch(err => console.warn('Transaction save failed:', err))

        // Update players list with the saved player
        const updatedPlayers = enforceOriginalTeam(
          dbPlayers.map((p: any) => (p.id === playerId ? savedPlayer : p)),
        )
        
        // Update teams list with the saved team
        const updatedTeams = dbTeams.map((t: any) => 
          t.id === teamId ? savedTeam : t
        )

        // Update local state immediately with new data (no need to refetch)
        setPlayers(updatedPlayers)
        setTeams(updatedTeams)
        setTransactions((prev) => [...prev, transaction])

        // Broadcast update asynchronously (non-blocking)
        broadcastUpdate({
          teams: updatedTeams,
          players: updatedPlayers,
          transactions: [...transactions, transaction],
          trades: trades,
          settings: settings,
        }).catch(err => console.error('Broadcast failed:', err))

        toast({
          title: "Player Sold!",
          description: `${player.name} sold to ${team.franchiseName || team.groupName} for ₹${price} Cr`,
        })

        return true
      } catch (error) {
        console.error('❌ Error selling player:', error)
        toast({ title: "Error", description: "Failed to complete sale", variant: "destructive" })
        return false
      }
    },
    [getPlayerById, getTeamById, settings, toast, broadcastUpdate],
  )

  // RTM: Check if team can use RTM on a player
  const canUseRTM = useCallback(
    (playerId: string, teamId: string) => {
      const player = getPlayerById(playerId)
      const team = getTeamById(teamId)

      if (!player || !team) {
        return { can: false, reason: "Player or team not found" }
      }

      if (team.rtmUsed) {
        return { can: false, reason: "RTM already used" }
      }

      if (player.status !== "Sold") {
        return { can: false, reason: "Player must be sold first" }
      }

      if (player.originalTeam !== teamId) {
        return { can: false, reason: "Player was not originally from this team" }
      }

      if (!player.purchasePrice) {
        return { can: false, reason: "Player purchase price not found" }
      }

      if (player.purchasePrice > team.remainingBudget) {
        return { can: false, reason: "Insufficient budget for RTM" }
      }

      const squadSize = team.squadPlayerIds.length
      if (squadSize >= settings.maxSquadSize) {
        return { can: false, reason: "Squad full" }
      }

      return { can: true, reason: "" }
    },
    [getPlayerById, getTeamById, settings],
  )

  // RTM: Use Right to Match
  const useRTM = useCallback(
    async (playerId: string, originalTeamId: string) => {
      const validation = canUseRTM(playerId, originalTeamId)
      if (!validation.can) {
        toast({ title: "Cannot Use RTM", description: validation.reason, variant: "destructive" })
        return false
      }

      const player = getPlayerById(playerId)!
      const originalTeam = getTeamById(originalTeamId)!
      const currentTeam = getTeamById(player.currentTeam!)!
      const rtmPrice = player.purchasePrice!

      console.log('🔄 Processing RTM - verifying with database')

      try {
        // Verify from database
        const [dbTeamsResponse, dbPlayersResponse] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/players')
        ])

        const dbTeams = await dbTeamsResponse.json()
        const dbPlayers = await dbPlayersResponse.json()

        const dbCurrentTeam = dbTeams.find((t: any) => t.id === currentTeam.id)
        const dbOriginalTeam = dbTeams.find((t: any) => t.id === originalTeamId)
        const dbPlayer = dbPlayers.find((p: any) => p.id === playerId)

        if (!dbCurrentTeam || !dbOriginalTeam || !dbPlayer) {
          toast({ title: "Error", description: "Data not found in database", variant: "destructive" })
          return false
        }

        // Update current team (refund)
        const updatedCurrentTeam = {
          ...dbCurrentTeam,
          remainingBudget: dbCurrentTeam.remainingBudget + rtmPrice,
          squadPlayerIds: (dbCurrentTeam.squadPlayerIds || []).filter((id: string) => id !== playerId),
        }

        // Update original team (deduct and add player)
        const updatedOriginalTeam = {
          ...dbOriginalTeam,
          remainingBudget: dbOriginalTeam.remainingBudget - rtmPrice,
          squadPlayerIds: [...(dbOriginalTeam.squadPlayerIds || []), playerId],
          rtmUsed: true,
        }

        // Update player
        const updatedPlayer = {
          ...dbPlayer,
          currentTeam: originalTeamId,
          purchasePrice: rtmPrice,
        }

        // Execute updates
        await Promise.all([
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCurrentTeam),
          }),
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOriginalTeam),
          }),
          fetch('/api/players', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlayer),
          }),
        ])

        // Record transaction
        const transaction: AuctionTransaction = {
          id: `txn-${Date.now()}`,
          playerId,
          playerName: player.name,
          soldPrice: rtmPrice,
          soldToTeam: originalTeamId,
          soldToTeamName: originalTeam.franchiseName || originalTeam.groupName,
          timestamp: new Date(),
          rtmUsedBy: originalTeamId,
          rtsUsedBy: null,
          type: "rtm",
        }

        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        })

        console.log('✅ RTM processed - Database updated')

        // Update local state with fresh data
        const [newTeams, newPlayers, newTransactions] = await Promise.all([
          fetch('/api/teams').then(r => r.json()),
          fetch('/api/players').then(r => r.json()),
          fetch('/api/transactions').then(r => r.json())
        ])

        setTeams(newTeams)
        setPlayers(enforceOriginalTeam(newPlayers))
        setTransactions(newTransactions)

        // Broadcast update to all clients
        await broadcastUpdate()

        toast({
          title: "RTM Used!",
          description: `${originalTeam.franchiseName || originalTeam.groupName} matched ₹${rtmPrice} Cr for ${player.name}`,
        })

        return true
      } catch (error) {
        console.error('❌ Error processing RTM:', error)
        toast({ title: "Error", description: "Failed to process RTM", variant: "destructive" })
        return false
      }
    },
    [canUseRTM, getPlayerById, getTeamById, toast, broadcastUpdate],
  )

  // RTS: Check if team can use RTS
  const canUseRTS = useCallback(
    (teamId: string) => {
      const team = getTeamById(teamId)

      if (!team) {
        return { can: false, reason: "Team not found" }
      }

      if (team.rtsUsed) {
        return { can: false, reason: "RTS already used" }
      }

      if (team.squadPlayerIds.length === 0) {
        return { can: false, reason: "No players in squad" }
      }

      return { can: true }
    },
    [getTeamById],
  )

  // RTS: Use Right to Sell
  const useRTS = useCallback(
    async (playerId: string, teamId: string) => {
      const validation = canUseRTS(teamId)
      if (!validation.can) {
        toast({ title: "Cannot Use RTS", description: validation.reason, variant: "destructive" })
        return false
      }

      const player = getPlayerById(playerId)
      const team = getTeamById(teamId)

      if (!player || !team) {
        toast({ title: "Error", description: "Player or team not found", variant: "destructive" })
        return false
      }

      if (player.currentTeam !== teamId) {
        toast({ title: "Error", description: "Player not owned by this team", variant: "destructive" })
        return false
      }

      const refundAmount = player.purchasePrice || 0

      console.log('🔄 Processing RTS - verifying with database')

      try {
        // Verify from database
        const dbTeamsResponse = await fetch('/api/teams')
        const dbTeams = await dbTeamsResponse.json()
        const dbTeam = dbTeams.find((t: any) => t.id === teamId)

        const dbPlayersResponse = await fetch('/api/players')
        const dbPlayers = await dbPlayersResponse.json()
        const dbPlayer = dbPlayers.find((p: any) => p.id === playerId)

        if (!dbTeam || !dbPlayer) {
          toast({ title: "Error", description: "Data not found in database", variant: "destructive" })
          return false
        }

        // Update team (refund and remove player)
        const updatedTeam = {
          ...dbTeam,
          remainingBudget: dbTeam.remainingBudget + refundAmount,
          squadPlayerIds: (dbTeam.squadPlayerIds || []).filter((id: string) => id !== playerId),
          rtsUsed: true,
        }

        // Update player (return to pool)
        const updatedPlayer = {
          ...dbPlayer,
          status: 'Unsold',
          currentTeam: null,
          purchasePrice: null,
        }

        // Execute updates
        await Promise.all([
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTeam),
          }),
          fetch('/api/players', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlayer),
          }),
        ])

        // Record transaction
        const transaction: AuctionTransaction = {
          id: `txn-${Date.now()}`,
          playerId,
          playerName: player.name,
          soldPrice: -refundAmount,
          soldToTeam: teamId,
          soldToTeamName: team.franchiseName || team.groupName,
          timestamp: new Date(),
          rtmUsedBy: null,
          rtsUsedBy: teamId,
          type: "rts",
        }

        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction),
        })

        console.log('✅ RTS completed - Database updated')

        // Update local state
        setTeams((prev) => prev.map((t) => t.id === teamId ? updatedTeam : t))
        setPlayers((prev) => prev.map((p) => p.id === playerId ? updatedPlayer : p))
        setTransactions((prev) => [...prev, transaction])

        // Broadcast update to all clients
        await broadcastUpdate()

        toast({
          title: "RTS Used!",
          description: `${player.name} returned to auction pool. Refund: ₹${refundAmount} Cr`,
        })

        return true
      } catch (error) {
        console.error('❌ Error using RTS:', error)
        toast({ title: "Error", description: "Failed to use RTS", variant: "destructive" })
        return false
      }
    },
    [canUseRTS, getPlayerById, getTeamById, toast, broadcastUpdate],
  )

  const undoLastTransaction = useCallback(() => {
    if (transactions.length === 0) {
      toast({ title: "No transactions", description: "Nothing to undo", variant: "destructive" })
      return
    }

    const lastTxn = transactions[transactions.length - 1]
    const player = getPlayerById(lastTxn.playerId)
    const team = getTeamById(lastTxn.soldToTeam)

    if (!player || !team) return

    if (lastTxn.type === "sale") {
      // Undo regular sale
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === lastTxn.playerId
            ? { ...p, status: "Unsold", currentTeam: null, purchasePrice: null }
            : p,
        ),
      )

      setTeams((prev) =>
        prev.map((t) =>
          t.id === lastTxn.soldToTeam
            ? {
                ...t,
                remainingBudget: t.remainingBudget + lastTxn.soldPrice,
                squadPlayerIds: t.squadPlayerIds.filter((id) => id !== lastTxn.playerId),
              }
            : t,
        ),
      )
    } else if (lastTxn.type === "rtm") {
      // Undo RTM - complex, need to restore previous owner
      toast({ title: "Cannot Undo RTM", description: "RTM undo not supported", variant: "destructive" })
      return
    } else if (lastTxn.type === "rts") {
      // Undo RTS
      setTeams((prev) =>
        prev.map((t) =>
          t.id === lastTxn.soldToTeam
            ? {
                ...t,
                remainingBudget: t.remainingBudget - Math.abs(lastTxn.soldPrice),
                squadPlayerIds: [...t.squadPlayerIds, lastTxn.playerId],
                rtsUsed: false,
              }
            : t,
        ),
      )

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === lastTxn.playerId
            ? { ...p, status: "Sold", currentTeam: lastTxn.soldToTeam, purchasePrice: Math.abs(lastTxn.soldPrice) }
            : p,
        ),
      )
    }

    setTransactions((prev) => prev.slice(0, -1))
    toast({ title: "Transaction Undone", description: "Last action reversed" })
  }, [transactions, getPlayerById, getTeamById, toast])

  const resetAuction = useCallback(async () => {
    setSettings(defaultSettings)
    setTeams(mockTeams)
    setPlayers(enforceOriginalTeam(mockPlayers))
    setTransactions([])
    setTrades([])
    
    // Clear server state
    try {
      await fetch('/api/auction', { method: 'DELETE' })
    } catch (error) {
      console.error('Failed to clear server state:', error)
    }
    
    toast({ title: "Auction Reset", description: "All data reset to initial state" })
  }, [toast])

  // Trading Window: Start trading phase
  const startTradingWindow = useCallback(async (durationMinutes: number) => {
    try {
      const endTime = new Date(Date.now() + durationMinutes * 60 * 1000)
      const newSettings = {
        initialBudget: settings.initialBudget,
        minSquadSize: settings.minSquadSize,
        maxSquadSize: settings.maxSquadSize,
        currentPhase: "Trading Window" as const,
        tradingWindowEnd: endTime
      }

      // Save to database
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const savedSettings = await response.json()
      setSettings(savedSettings)

      // Broadcast update
      await broadcastUpdate()

      toast({
        title: "Trading Window Opened",
        description: `Trading will close in ${durationMinutes} minutes`
      })
    } catch (error) {
      console.error('❌ Error starting trading window:', error)
      toast({ title: "Error", description: "Failed to start trading window", variant: "destructive" })
    }
  }, [settings, toast, broadcastUpdate])

  // Trading Window: End trading window
  const endTradingWindow = useCallback(async () => {
    try {
      const newSettings = {
        initialBudget: settings.initialBudget,
        minSquadSize: settings.minSquadSize,
        maxSquadSize: settings.maxSquadSize,
        currentPhase: "Pre-Auction" as const,
        tradingWindowEnd: null
      }

      // Save to database
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const savedSettings = await response.json()
      setSettings(savedSettings)

      // Broadcast update
      await broadcastUpdate()

      toast({
        title: "Trading Window Closed",
        description: "The trading window has been closed successfully"
      })
    } catch (error) {
      console.error('❌ Error ending trading window:', error)
      toast({ title: "Error", description: "Failed to end trading window", variant: "destructive" })
    }
  }, [settings, toast, broadcastUpdate])

  // Trading Window: Propose a trade
  const proposeTrade = useCallback(async (
    proposedBy: string,
    proposedTo: string,
    offeredPlayers: string[],
    requestedPlayers: string[],
    message?: string
  ) => {
    const proposingTeam = getTeamById(proposedBy)
    const targetTeam = getTeamById(proposedTo)

    if (!proposingTeam || !targetTeam) {
      toast({ title: "Error", description: "Teams not found", variant: "destructive" })
      return false
    }

    if (settings.currentPhase !== "Trading Window") {
      toast({ title: "Error", description: "Trading window is not open", variant: "destructive" })
      return false
    }

    if (offeredPlayers.length === 0 || requestedPlayers.length === 0) {
      toast({ title: "Error", description: "Both teams must offer at least one player", variant: "destructive" })
      return false
    }

    // Enforce 1-for-1 player trades only
    if (offeredPlayers.length !== 1 || requestedPlayers.length !== 1) {
      toast({ title: "Error", description: "Only 1-for-1 player trades are allowed", variant: "destructive" })
      return false
    }

    console.log('🔄 Proposing trade - verifying with database')

    try {
      // Verify players from database
      const dbPlayersResponse = await fetch('/api/players')
      const dbPlayers = await dbPlayersResponse.json()

      // Verify all offered players belong to proposing team
      const invalidOffered = offeredPlayers.some(pid => {
        const player = dbPlayers.find((p: any) => p.id === pid)
        return !player || player.currentTeam !== proposedBy
      })

      if (invalidOffered) {
        toast({ title: "Error", description: "You can only trade your own players", variant: "destructive" })
        return false
      }

      // Verify all requested players belong to target team
      const invalidRequested = requestedPlayers.some(pid => {
        const player = dbPlayers.find((p: any) => p.id === pid)
        return !player || player.currentTeam !== proposedTo
      })

      if (invalidRequested) {
        toast({ title: "Error", description: "Invalid player selection from target team", variant: "destructive" })
        return false
      }

      // Get player names
      const offeredPlayerNames = offeredPlayers.map(pid => {
        const player = dbPlayers.find((p: any) => p.id === pid)
        return player?.name || 'Unknown'
      })

      const requestedPlayerNames = requestedPlayers.map(pid => {
        const player = dbPlayers.find((p: any) => p.id === pid)
        return player?.name || 'Unknown'
      })

      const trade: Trade = {
        id: `trade-${Date.now()}`,
        proposedBy,
        proposedByName: proposingTeam.franchiseName || proposingTeam.groupName,
        proposedTo,
        proposedToName: targetTeam.franchiseName || targetTeam.groupName,
        offeredPlayers,
        offeredPlayerNames,
        requestedPlayers,
        requestedPlayerNames,
        status: "Pending",
        proposedAt: new Date(),
        message
      }

      // Save to database
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trade),
      })

      if (!response.ok) {
        throw new Error('Failed to save trade to database')
      }

      const savedTrade = await response.json()
      console.log('✅ Trade proposed - Database updated:', savedTrade)

      setTrades(prev => [...prev, savedTrade])

      // Broadcast update
      await broadcastUpdate()

      toast({
        title: "Trade Proposed",
        description: `Trade offer sent to ${trade.proposedToName}`
      })

      return true
    } catch (error) {
      console.error('❌ Error proposing trade:', error)
      toast({ title: "Error", description: "Failed to propose trade", variant: "destructive" })
      return false
    }
  }, [settings, getTeamById, getPlayerById, toast, broadcastUpdate])

  // Trading Window: Respond to trade (accept/reject)
  const respondToTrade = useCallback(async (tradeId: string, accept: boolean) => {
    const trade = trades.find(t => t.id === tradeId)

    if (!trade) {
      toast({ title: "Error", description: "Trade not found", variant: "destructive" })
      return false
    }

    if (trade.status !== "Pending") {
      toast({ title: "Error", description: "Trade already processed", variant: "destructive" })
      return false
    }

    if (settings.currentPhase !== "Trading Window") {
      toast({ title: "Error", description: "Trading window is closed", variant: "destructive" })
      return false
    }

    console.log('🔄 Responding to trade - updating database')

    try {
      // Verify trade exists in database
      const [dbTradesResponse, dbPlayersResponse, dbTeamsResponse] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/players'),
        fetch('/api/teams')
      ])

      const dbTrades = await dbTradesResponse.json()
      const dbPlayers = await dbPlayersResponse.json()
      const dbTeams = await dbTeamsResponse.json()

      const dbTrade = dbTrades.find((t: any) => t.id === tradeId)

      if (!dbTrade || dbTrade.status !== 'Pending') {
        toast({ title: "Error", description: "Trade status changed", variant: "destructive" })
        return false
      }

      if (accept) {
        // Execute the trade immediately - swap players between teams
        const playerUpdates = dbPlayers.map((p: any) => {
          if (trade.offeredPlayers.includes(p.id)) {
            return fetch('/api/players', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...p, currentTeam: trade.proposedTo }),
            })
          }
          if (trade.requestedPlayers.includes(p.id)) {
            return fetch('/api/players', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...p, currentTeam: trade.proposedBy }),
            })
          }
          return null
        }).filter(Boolean)

        // Update team squads
        const proposingTeam = dbTeams.find((t: any) => t.id === trade.proposedBy)
        const targetTeam = dbTeams.find((t: any) => t.id === trade.proposedTo)

        const teamUpdates = [
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...proposingTeam,
              squadPlayerIds: [
                ...(proposingTeam.squadPlayerIds || []).filter((pid: string) => !trade.offeredPlayers.includes(pid)),
                ...trade.requestedPlayers
              ]
            }),
          }),
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...targetTeam,
              squadPlayerIds: [
                ...(targetTeam.squadPlayerIds || []).filter((pid: string) => !trade.requestedPlayers.includes(pid)),
                ...trade.offeredPlayers
              ]
            }),
          })
        ]

        await Promise.all([...playerUpdates, ...teamUpdates])

        // Update trade status to Accepted
        const updatedTrade = {
          ...dbTrade,
          status: "Accepted",
          respondedAt: new Date(),
        }

        const response = await fetch('/api/trades', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTrade),
        })

        if (!response.ok) {
          throw new Error('Failed to update trade in database')
        }

        const savedTrade = await response.json()
        console.log('✅ Trade completed - Database updated:', savedTrade)

        // Refresh all data from database
        const [newPlayers, newTeams] = await Promise.all([
          fetch('/api/players').then(r => r.json()),
          fetch('/api/teams').then(r => r.json())
        ])

        setPlayers(enforceOriginalTeam(newPlayers))
        setTeams(newTeams)
        setTrades(prev => prev.map(t => t.id === tradeId ? savedTrade : t))

        // Broadcast update
        await broadcastUpdate()

        toast({
          title: "Trade Completed!",
          description: `Players exchanged between ${trade.proposedByName} and ${trade.proposedToName}`
        })
      } else {
        // Reject the trade
        const updatedTrade = {
          ...dbTrade,
          status: "Rejected",
          respondedAt: new Date(),
        }

        const response = await fetch('/api/trades', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTrade),
        })

        if (!response.ok) {
          throw new Error('Failed to update trade in database')
        }

        const savedTrade = await response.json()
        console.log('✅ Trade rejected - Database updated:', savedTrade)

        setTrades(prev => prev.map(t => t.id === tradeId ? savedTrade : t))

        // Broadcast update
        await broadcastUpdate()

        toast({
          title: "Trade Rejected",
          description: "Trade offer declined"
        })
      }

      return true
    } catch (error) {
      console.error('❌ Error responding to trade:', error)
      toast({ title: "Error", description: "Failed to respond to trade", variant: "destructive" })
      return false
    }
  }, [trades, settings, toast, broadcastUpdate])

  // Trading Window: Cancel trade
  const cancelTrade = useCallback(async (tradeId: string, teamId: string) => {
    const trade = trades.find(t => t.id === tradeId)

    if (!trade) {
      toast({ title: "Error", description: "Trade not found", variant: "destructive" })
      return false
    }

    if (trade.proposedBy !== teamId) {
      toast({ title: "Error", description: "Only the proposing team can cancel", variant: "destructive" })
      return false
    }

    if (trade.status !== "Pending") {
      toast({ title: "Error", description: "Trade already processed", variant: "destructive" })
      return false
    }

    console.log('🔄 Cancelling trade - updating database')

    try {
      // Verify from database
      const dbTradesResponse = await fetch('/api/trades')
      const dbTrades = await dbTradesResponse.json()
      const dbTrade = dbTrades.find((t: any) => t.id === tradeId)

      if (!dbTrade || dbTrade.status !== 'Pending') {
        toast({ title: "Error", description: "Trade status changed", variant: "destructive" })
        return false
      }

      const updatedTrade = {
        ...dbTrade,
        status: "Cancelled",
        respondedAt: new Date(),
      }

      // Update in database
      const response = await fetch('/api/trades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTrade),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel trade in database')
      }

      const savedTrade = await response.json()
      console.log('✅ Trade cancelled - Database updated:', savedTrade)

      setTrades(prev => prev.map(t => t.id === tradeId ? savedTrade : t))

      // Broadcast update
      await broadcastUpdate()

      toast({ title: "Trade Cancelled", description: "Trade offer withdrawn" })
      return true
    } catch (error) {
      console.error('❌ Error cancelling trade:', error)
      toast({ title: "Error", description: "Failed to cancel trade", variant: "destructive" })
      return false
    }
  }, [trades, toast, broadcastUpdate])
  // Wait until initial data has been loaded from server to avoid
  // rendering UI with mock/default settings (e.g. default 100 Cr)
  if (!isInitialized) {
    return (
      <div style={{ padding: 12 }}>Loading auction configuration…</div>
    )
  }

  return (
    <AuctionContext.Provider
      value={{
        settings,
        teams,
        players,
        transactions,
        trades,
        availableFranchises,
        assignFranchise,
        canStartPlayerAuction,
        startPlayerAuction,
        startTradingWindow,
        endTradingWindow,
        proposeTrade,
        respondToTrade,
        cancelTrade,
        sellPlayer,
        useRTM,
        canUseRTM,
        useRTS,
        canUseRTS,
        getTeamById,
        getPlayerById,
        getTeamPlayers,
        resetAuction,
        undoLastTransaction,
      }}
    >
      {children}
    </AuctionContext.Provider>
  )
}

export function useAuction() {
  const context = useContext(AuctionContext)
  if (!context) {
    throw new Error("useAuction must be used within an AuctionProvider")
  }
  return context
}

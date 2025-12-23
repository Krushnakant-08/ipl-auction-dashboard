"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { Team, Player, AuctionSettings, AuctionTransaction } from "./types"
import { mockTeams, mockPlayers, defaultSettings, availableFranchises } from "./mock-data"
import { useToast } from "@/hooks/use-toast"

interface AuctionContextType {
  settings: AuctionSettings
  teams: Team[]
  players: Player[]
  transactions: AuctionTransaction[]
  availableFranchises: typeof availableFranchises

  // Team Auction
  assignFranchise: (teamId: string, franchiseId: string, bidAmount: number) => boolean
  canStartPlayerAuction: () => boolean
  startPlayerAuction: () => void

  // Player Auction
  sellPlayer: (playerId: string, teamId: string, price: number) => boolean

  // RTM
  useRTM: (playerId: string, originalTeamId: string) => boolean
  canUseRTM: (playerId: string, teamId: string) => { can: boolean; reason?: string }

  // RTS
  useRTS: (playerId: string, teamId: string) => boolean
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
  const [players, setPlayers] = useState<Player[]>(mockPlayers)
  const [transactions, setTransactions] = useState<AuctionTransaction[]>([])

  const getTeamById = useCallback((teamId: string) => teams.find((t) => t.id === teamId), [teams])
  const getPlayerById = useCallback((playerId: string) => players.find((p) => p.id === playerId), [players])
  const getTeamPlayers = useCallback((teamId: string) => players.filter((p) => p.currentTeam === teamId), [players])

  // Team Auction: Assign franchise to team
  const assignFranchise = useCallback(
    (teamId: string, franchiseId: string, bidAmount: number) => {
      const team = getTeamById(teamId)
      const franchise = availableFranchises.find((f) => f.id === franchiseId)

      if (!team || !franchise) {
        toast({ title: "Error", description: "Team or franchise not found", variant: "destructive" })
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

      // Check if franchise already taken
      const franchiseTaken = teams.some((t) => t.franchiseName === franchise.name && t.id !== teamId)
      if (franchiseTaken) {
        toast({ title: "Franchise Taken", description: "This franchise is already assigned", variant: "destructive" })
        return false
      }

      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                franchiseName: franchise.name,
                franchiseBid: bidAmount,
                remainingBudget: settings.initialBudget - bidAmount,
                logo: franchise.logo,
                teamAuctionComplete: true,
              }
            : t,
        ),
      )

      toast({
        title: "Franchise Assigned!",
        description: `${team.groupName} won ${franchise.name} for ₹${bidAmount} Cr`,
      })

      return true
    },
    [getTeamById, teams, settings, toast],
  )

  const canStartPlayerAuction = useCallback(() => {
    return teams.every((t) => t.teamAuctionComplete)
  }, [teams])

  const startPlayerAuction = useCallback(() => {
    if (!canStartPlayerAuction()) {
      toast({
        title: "Cannot Start Player Auction",
        description: "All teams must complete franchise auction first",
        variant: "destructive",
      })
      return
    }

    setSettings((prev) => ({ ...prev, currentPhase: "Player Auction" }))
    toast({
      title: "Player Auction Started!",
      description: "Teams can now bid for players",
    })
  }, [canStartPlayerAuction, toast])

  // Player Auction: Sell player to team
  const sellPlayer = useCallback(
    (playerId: string, teamId: string, price: number) => {
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

      // Update player
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, status: "Sold", currentTeam: teamId, purchasePrice: price, originalTeam: teamId }
            : p,
        ),
      )

      // Update team
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                remainingBudget: t.remainingBudget - price,
                squadPlayerIds: [...t.squadPlayerIds, playerId],
              }
            : t,
        ),
      )

      // Record transaction
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

      setTransactions((prev) => [...prev, transaction])

      toast({
        title: "Player Sold!",
        description: `${player.name} sold to ${team.franchiseName || team.groupName} for ₹${price} Cr`,
      })

      return true
    },
    [getPlayerById, getTeamById, settings, toast],
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

      return { can: true }
    },
    [getPlayerById, getTeamById, settings],
  )

  // RTM: Use Right to Match
  const useRTM = useCallback(
    (playerId: string, originalTeamId: string) => {
      const validation = canUseRTM(playerId, originalTeamId)
      if (!validation.can) {
        toast({ title: "Cannot Use RTM", description: validation.reason, variant: "destructive" })
        return false
      }

      const player = getPlayerById(playerId)!
      const originalTeam = getTeamById(originalTeamId)!
      const currentTeam = getTeamById(player.currentTeam!)!
      const rtmPrice = player.purchasePrice!

      // Refund current team
      setTeams((prev) =>
        prev.map((t) => {
          if (t.id === currentTeam.id) {
            return {
              ...t,
              remainingBudget: t.remainingBudget + rtmPrice,
              squadPlayerIds: t.squadPlayerIds.filter((id) => id !== playerId),
            }
          }
          if (t.id === originalTeamId) {
            return {
              ...t,
              remainingBudget: t.remainingBudget - rtmPrice,
              squadPlayerIds: [...t.squadPlayerIds, playerId],
              rtmUsed: true,
            }
          }
          return t
        }),
      )

      // Update player
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, currentTeam: originalTeamId, purchasePrice: rtmPrice } : p)),
      )

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

      setTransactions((prev) => [...prev, transaction])

      toast({
        title: "RTM Used!",
        description: `${originalTeam.franchiseName || originalTeam.groupName} matched ₹${rtmPrice} Cr for ${player.name}`,
      })

      return true
    },
    [canUseRTM, getPlayerById, getTeamById, toast],
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
    (playerId: string, teamId: string) => {
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

      // Refund team and remove player
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? {
                ...t,
                remainingBudget: t.remainingBudget + refundAmount,
                squadPlayerIds: t.squadPlayerIds.filter((id) => id !== playerId),
                rtsUsed: true,
              }
            : t,
        ),
      )

      // Update player
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, status: "Unsold", currentTeam: null, purchasePrice: null } : p)),
      )

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

      setTransactions((prev) => [...prev, transaction])

      toast({
        title: "RTS Used!",
        description: `${player.name} returned to auction pool. Refund: ₹${refundAmount} Cr`,
      })

      return true
    },
    [canUseRTS, getPlayerById, getTeamById, toast],
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
            ? { ...p, status: "Unsold", currentTeam: null, purchasePrice: null, originalTeam: null }
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

  const resetAuction = useCallback(() => {
    setSettings(defaultSettings)
    setTeams(mockTeams)
    setPlayers(mockPlayers)
    setTransactions([])
    toast({ title: "Auction Reset", description: "All data reset to initial state" })
  }, [toast])

  return (
    <AuctionContext.Provider
      value={{
        settings,
        teams,
        players,
        transactions,
        availableFranchises,
        assignFranchise,
        canStartPlayerAuction,
        startPlayerAuction,
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

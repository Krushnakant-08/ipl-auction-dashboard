"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuction } from "@/lib/auction-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Gavel, User, DollarSign, TrendingUp, RotateCcw, AlertCircle, Building2, Play, ListX } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RTMDialog } from "@/components/rtm-dialog"
import { useToast } from "@/hooks/use-toast"

export default function AuctionPage() {
  const { toast } = useToast()
  const {
    settings,
    players,
    teams,
    sellPlayer,
    undoLastTransaction,
    transactions,
    availableFranchises,
    assignFranchise,
    canStartRtmRtsAuction,
    startRtmRtsAuction,
    sellRtmCard,
    sellRtsCard,
    canStartPlayerAuction,
    startPlayerAuction,
  } = useAuction()

  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("")
  const [franchiseBid, setFranchiseBid] = useState<string>("")

  // RTM/RTS Auction state
  const [selectedTeamForRtm, setSelectedTeamForRtm] = useState<string>("")
  const [rtmPrice, setRtmPrice] = useState<string>("")
  const [selectedTeamForRts, setSelectedTeamForRts] = useState<string>("")
  const [rtsPrice, setRtsPrice] = useState<string>("")

  // Player auction state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [soldPrice, setSoldPrice] = useState<string>("")

  // RTM dialog state
  const [rtmPlayerId, setRtmPlayerId] = useState<string | null>(null)
  const [rtmOriginalTeamId, setRtmOriginalTeamId] = useState<string | null>(null)

  // Unsold players state
  const [markingUnsold, setMarkingUnsold] = useState(false)
  const [unsoldPlayersWithTimestamp, setUnsoldPlayersWithTimestamp] = useState<Array<{id: string, playerId: string, timestamp: string}>>([])  
  
  // Selected transaction for undo
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

  const unsoldPlayers = useMemo(() => players.filter((p) => p.status === "Unsold"), [players])
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const isTeamAuctionPhase = settings.currentPhase === "Team Auction"
  const isPlayerAuctionPhase = settings.currentPhase === "Player Auction"

  // Fetch unsold players with timestamps
  const fetchUnsoldPlayersWithTimestamp = async () => {
    try {
      const response = await fetch('/api/unsold-players')
      if (response.ok) {
        const data = await response.json()
        setUnsoldPlayersWithTimestamp(data)
      }
    } catch (error) {
      console.error('Failed to fetch unsold players:', error)
    }
  }

  // Fetch on mount and when phase changes
  useEffect(() => {
    if (isPlayerAuctionPhase) {
      fetchUnsoldPlayersWithTimestamp()
    }
  }, [isPlayerAuctionPhase])

  // Sort unsold players by timestamp (most recent first)
  const sortedUnsoldPlayers = useMemo(() => {
    if (unsoldPlayersWithTimestamp.length === 0) {
      return unsoldPlayers
    }
    
    return [...unsoldPlayers].sort((a, b) => {
      const aData = unsoldPlayersWithTimestamp.find(u => u.playerId === a.id)
      const bData = unsoldPlayersWithTimestamp.find(u => u.playerId === b.id)
      
      if (!aData) return 1
      if (!bData) return -1
      
      return new Date(bData.timestamp).getTime() - new Date(aData.timestamp).getTime()
    })
  }, [unsoldPlayers, unsoldPlayersWithTimestamp])

  const teamsWithoutFranchise = teams.filter((t) => !t.teamAuctionComplete)
  const assignedFranchiseIds = teams.filter((t) => t.teamAuctionComplete).map((t) => t.franchiseName)
  const availableFranchisesForAuction = availableFranchises.filter((f) => !assignedFranchiseIds.includes(f.name))

  const selectedGroup = teams.find((t) => t.id === selectedGroupId)
  const selectedFranchise = availableFranchises.find((f) => f.id === selectedFranchiseId)

  const handleAssignFranchise = async () => {
    if (!selectedGroupId || !selectedFranchiseId || !franchiseBid) {
      return
    }

    const bid = Number.parseFloat(franchiseBid)
    if (Number.isNaN(bid) || bid < 0) {
      return
    }

    const success = await assignFranchise(selectedGroupId, selectedFranchiseId, bid)
    if (success) {
      setSelectedGroupId("")
      setSelectedFranchiseId("")
      setFranchiseBid("")
    }
  }

  const handleStartPlayerAuction = async () => {
    console.log('🎬 Starting player auction...')
    try {
      await startPlayerAuction()
      console.log('✅ Player auction started successfully')
    } catch (error) {
      console.error('❌ Failed to start player auction:', error)
    }
  }

  const handleStartRtmRtsAuction = async () => {
    try {
      await startRtmRtsAuction()
    } catch (error) {
      console.error('❌ Failed to start RTM/RTS auction:', error)
    }
  }

  const handleSellRtmCard = async () => {
    if (!selectedTeamForRtm || !rtmPrice) return
    const price = Number.parseFloat(rtmPrice)
    if (Number.isNaN(price) || price <= 0) return

    const success = await sellRtmCard(selectedTeamForRtm, price)
    if (success) {
      setSelectedTeamForRtm("")
      setRtmPrice("")
    }
  }

  const handleSellRtsCard = async () => {
    if (!selectedTeamForRts || !rtsPrice) return
    const price = Number.parseFloat(rtsPrice)
    if (Number.isNaN(price) || price <= 0) return

    const success = await sellRtsCard(selectedTeamForRts, price)
    if (success) {
      setSelectedTeamForRts("")
      setRtsPrice("")
    }
  }

  const handleMarkAsUnsold = async () => {
    if (!selectedPlayerId) {
      return
    }

    setMarkingUnsold(true)
    try {
      const response = await fetch('/api/unsold-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', playerId: selectedPlayerId }),
      })
      
      if (response.ok) {
        console.log(`✅ Player marked as unsold`)
        // Refresh unsold players list to show new player at top
        await fetchUnsoldPlayersWithTimestamp()
        // Clear selection after marking as unsold
        setSelectedPlayerId('')
        setSoldPrice('')
      } else {
        const data = await response.json()
        console.error('❌ Failed to mark as unsold:', data.error)
        alert(`Failed to mark as unsold: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Error marking as unsold:', error)
      alert('Error marking player as unsold')
    } finally {
      setMarkingUnsold(false)
    }
  }

  const handleUndoTransaction = async (transactionId: string) => {
    const txn = transactions.find(t => t.id === transactionId)
    if (!txn) {
      alert('Transaction not found')
      return
    }

    if (txn.type === "rtm" || txn.type === "rts") {
      alert('Cannot undo RTM/RTS transactions')
      return
    }

    const player = players.find(p => p.id === txn.playerId)
    const team = teams.find(t => t.id === txn.soldToTeam)

    if (!player || !team) {
      alert('Player or team not found')
      return
    }

    if (!confirm(`Undo transaction: ${player.name} sold to ${team.franchiseName || team.groupName} for ₹${txn.soldPrice} Cr?\n\nThis will:\n- Return player to Unsold status\n- Refund ₹${txn.soldPrice} Cr to team\n- Remove player from squad\n- Delete transaction record`)) {
      return
    }

    try {
      console.log('🔄 Starting transaction reversal...')
      console.log('📊 Current state:', {
        playerStatus: player.status,
        teamBudget: team.remainingBudget,
        squadSize: team.squadPlayerIds?.length || 0
      })

      // Step 1: Delete the transaction from database
      const deleteResponse = await fetch(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
      })

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json()
        throw new Error(error.error || 'Failed to delete transaction')
      }
      console.log('✅ Transaction deleted from database')

      // Step 2: Revert player to Unsold status (as if never auctioned)
      const updatedPlayer = {
        ...player,
        status: 'Unsold' as const,
        currentTeam: null,
        currentTeamName: null,
        purchasePrice: null
      }

      const playerResponse = await fetch('/api/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPlayer)
      })

      if (!playerResponse.ok) {
        throw new Error('Failed to update player status')
      }
      const savedPlayer = await playerResponse.json()
      console.log('✅ Player reverted to Unsold status')

      // Step 3: Restore team budget and remove player from squad
      const updatedTeam = {
        ...team,
        remainingBudget: team.remainingBudget + txn.soldPrice,
        squadPlayerIds: (team.squadPlayerIds || []).filter((id: string) => id !== txn.playerId)
      }

      const teamResponse = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeam)
      })

      if (!teamResponse.ok) {
        throw new Error('Failed to update team')
      }
      const savedTeam = await teamResponse.json()
      console.log('✅ Team budget restored and player removed from squad')
      console.log('💰 New budget:', savedTeam.remainingBudget.toFixed(1), 'Cr')
      console.log('👥 New squad size:', savedTeam.squadPlayerIds?.length || 0)

      // Step 4: Broadcast sync to all clients
      await fetch('/api/auction/sync', { method: 'POST' })
      console.log('✅ Changes synced to all clients')

      setSelectedTransactionId(null)
      
      toast({
        title: "Transaction Reversed",
        description: `${player.name} returned to unsold players. ₹${txn.soldPrice} Cr refunded to ${team.franchiseName || team.groupName}.`
      })
    } catch (error) {
      console.error('❌ Error reversing transaction:', error)
      alert(`Failed to reverse transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleConfirmSale = async () => {
    if (!selectedPlayerId || !selectedTeamId || !soldPrice) {
      return
    }

    const price = Number.parseFloat(soldPrice)
    if (Number.isNaN(price) || price <= 0) {
      return
    }

    const success = await sellPlayer(selectedPlayerId, selectedTeamId, price)
    if (success) {
      const player = players.find((p) => p.id === selectedPlayerId)
      if (player?.originalTeam && player.originalTeam !== selectedTeamId) {
        // Player has an original team and was sold to a different team
        setRtmPlayerId(selectedPlayerId)
        setRtmOriginalTeamId(player.originalTeam)
      }

      setSelectedPlayerId("")
      setSelectedTeamId("")
      setSoldPrice("")
    }
  }

  const canConfirmFranchise =
    selectedGroupId && selectedFranchiseId && franchiseBid && Number.parseFloat(franchiseBid) >= 0
  const canConfirmSale = selectedPlayerId && selectedTeamId && soldPrice && Number.parseFloat(soldPrice) > 0

  const recentTransactions = useMemo(() => {
    return [...transactions].reverse()
  }, [transactions])

  const isTeamAuctionPhase = settings.currentPhase === "Team Auction"
  const isPlayerAuctionPhase = settings.currentPhase === "Player Auction"

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <RTMDialog
        playerId={rtmPlayerId}
        originalTeamId={rtmOriginalTeamId}
        onClose={() => {
          setRtmPlayerId(null)
          setRtmOriginalTeamId(null)
        }}
      />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Live Auction</h1>
              <p className="text-muted-foreground mt-1">
                {isTeamAuctionPhase && "Conduct team franchise auction"}
                {isRtmRtsAuctionPhase && "Conduct RTM and RTS card auction"}
                {isPlayerAuctionPhase && "Conduct player auctions in real-time"}
              </p>
            </div>
            <Badge variant={isPlayerAuctionPhase ? "default" : "secondary"} className="text-lg px-4 py-2">
              {settings.currentPhase}
            </Badge>
          </div>
        </div>

        {isTeamAuctionPhase && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Team Franchise Auction
                  </CardTitle>
                  <CardDescription>Assign franchises to team groups</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Group Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="group" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Select Team Group
                    </Label>
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                      <SelectTrigger id="group">
                        <SelectValue placeholder="Choose a team group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamsWithoutFranchise.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">All teams have franchises</div>
                        ) : (
                          teamsWithoutFranchise.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.groupName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Franchise Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="franchise" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Select Franchise
                    </Label>
                    <Select value={selectedFranchiseId} onValueChange={setSelectedFranchiseId}>
                      <SelectTrigger id="franchise">
                        <SelectValue placeholder="Choose a franchise..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFranchisesForAuction.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No franchises available</div>
                        ) : (
                          availableFranchisesForAuction.map((franchise) => (
                            <SelectItem key={franchise.id} value={franchise.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{franchise.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Info */}
                  {selectedGroup && selectedFranchise && (
                    <Card className="bg-accent/5 border-accent">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Team Group</div>
                            <div className="font-semibold text-lg">{selectedGroup.groupName}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Franchise</div>
                            <div className="font-semibold text-lg">{selectedFranchise.name}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Bid Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="bid" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Enter Bid Amount (Crores)
                    </Label>
                    <Input
                      id="bid"
                      type="number"
                      step="0.1"
                      min="0"
                      max={settings.initialBudget}
                      placeholder="Enter franchise bid..."
                      value={franchiseBid}
                      onChange={(e) => setFranchiseBid(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Budget after purchase: ₹
                      {(settings.initialBudget - Number.parseFloat(franchiseBid || "0")).toFixed(1)} Cr
                    </p>
                  </div>

                  {/* Confirm Button */}
                  <Button onClick={handleAssignFranchise} disabled={!canConfirmFranchise} className="w-full" size="lg">
                    <Gavel className="h-4 w-4 mr-2" />
                    Assign Franchise
                  </Button>
                </CardContent>
              </Card>

              {/* Completed Franchise Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle>Franchise Assignments</CardTitle>
                  <CardDescription>Teams that have acquired franchises</CardDescription>
                </CardHeader>
                <CardContent>
                  {teams.filter((t) => t.teamAuctionComplete).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No franchises assigned yet</div>
                  ) : (
                    <div className="space-y-3">
                      {teams
                        .filter((t) => t.teamAuctionComplete)
                        .map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{team.franchiseName}</div>
                              <div className="text-sm text-muted-foreground">{team.groupName}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">₹{team.franchiseBid?.toFixed(1)} Cr</div>
                              <div className="text-xs text-muted-foreground">
                                ₹{team.remainingBudget?.toFixed(1)} Cr left
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Progress */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Auction Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Teams Assigned</span>
                      <span className="font-bold">
                        {teams.filter((t) => t.teamAuctionComplete).length} / {teams.length}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(teams.filter((t) => t.teamAuctionComplete).length / teams.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleStartRtmRtsAuction} 
                    disabled={!canStartRtmRtsAuction()}
                    className="w-full" 
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start RTM/RTS Auction
                  </Button>
                  
                  {!canStartRtmRtsAuction() && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Complete franchise assignments first
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Franchises</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableFranchisesForAuction.map((franchise) => (
                      <div key={franchise.id} className="p-2 rounded-lg border bg-card">
                        <div className="font-medium text-sm">{franchise.name}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* RTM/RTS Auction Phase */}
        {isRtmRtsAuctionPhase && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RTM Card Auction */}
            <Card className="border-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  RTM Card Auction
                </CardTitle>
                <CardDescription>Right to Match - Bid for 1 additional RTM card (Teams start with 1)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Select Team</Label>
                  <Select value={selectedTeamForRtm} onValueChange={setSelectedTeamForRtm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter((t) => t.teamAuctionComplete && (t.rtmCount || 0) < 2)
                        .map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.franchiseName} (₹{team.remainingBudget.toFixed(1)} Cr)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bid Amount (Crores)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Enter bid amount..."
                    value={rtmPrice}
                    onChange={(e) => setRtmPrice(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSellRtmCard}
                  disabled={!selectedTeamForRtm || !rtmPrice}
                  className="w-full"
                  size="lg"
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  Sell RTM Card
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Teams with Additional RTM</h4>
                  <div className="space-y-2">
                    {teams
                      .filter((t) => (t.rtmCount || 0) > 1)
                      .map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                          <span className="font-medium">{team.franchiseName}</span>
                          <Badge>{team.rtmCount} RTM Cards</Badge>
                        </div>
                      ))}
                    {teams.filter((t) => (t.rtmCount || 0) > 1).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No additional RTM cards purchased yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RTS Card Auction */}
            <Card className="border-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  RTS Card Auction
                </CardTitle>
                <CardDescription>Right to Sell - Bid for 1 additional RTS card (Teams start with 1)</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Select Team</Label>
                  <Select value={selectedTeamForRts} onValueChange={setSelectedTeamForRts}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter((t) => t.teamAuctionComplete && (t.rtsCount || 0) < 2)
                        .map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.franchiseName} (₹{team.remainingBudget.toFixed(1)} Cr)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bid Amount (Crores)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Enter bid amount..."
                    value={rtsPrice}
                    onChange={(e) => setRtsPrice(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSellRtsCard}
                  disabled={!selectedTeamForRts || !rtsPrice}
                  className="w-full"
                  size="lg"
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  Sell RTS Card
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Teams with Additional RTS</h4>
                  <div className="space-y-2">
                    {teams
                      .filter((t) => (t.rtsCount || 0) > 1)
                      .map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                          <span className="font-medium">{team.franchiseName}</span>
                          <Badge>{team.rtsCount} RTS Cards</Badge>
                        </div>
                      ))}
                    {teams.filter((t) => (t.rtsCount || 0) > 1).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No additional RTS cards purchased yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Section - Start Player Auction */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Ready to Start Player Auction?</CardTitle>
                <CardDescription>Proceed to player auction after RTM/RTS cards are allocated</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartPlayerAuction} 
                  className="w-full" 
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Player Auction
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Player Auction Phase */}

        {isPlayerAuctionPhase && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Auction Panel */}
            <div className="lg:col-span-2 space-y-6 order-1 lg:order-1">
              <Card className="border-primary">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    Auction Panel
                  </CardTitle>
                  <CardDescription>Select player, team, and confirm the sale</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {unsoldPlayers.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No unsold players available
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Player Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="player" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Select Player
                    </Label>
                    <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                      <SelectTrigger id="player">
                        <SelectValue placeholder="Choose a player to auction..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedUnsoldPlayers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No unsold players available
                          </div>
                        ) : (
                          sortedUnsoldPlayers.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">{player.name}</span>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {player.role}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {player.country}
                                  </Badge>
                                  <span className="text-muted-foreground">₹{player.basePrice} Cr</span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Current Player Details */}
                  {selectedPlayer && (
                    <Card className="bg-accent/5 border-accent">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Player Name</div>
                            <div className="font-semibold text-lg">{selectedPlayer.name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Role</div>
                            <Badge variant="default">{selectedPlayer.role}</Badge>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Country</div>
                            <Badge variant="secondary">{selectedPlayer.country}</Badge>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Base Price</div>
                            <div className="font-bold text-xl text-primary">₹{selectedPlayer.basePrice} Cr</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Team Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="team" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Select Buying Team
                    </Label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger id="team">
                        <SelectValue placeholder="Choose the team buying this player..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => {
                          const remaining = team.remainingBudget || 0
                          return (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">{team.franchiseName || team.groupName}</span>
                                <span className="text-xs text-muted-foreground">
                                  ₹{remaining.toFixed(1)} Cr remaining
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Budget Info */}
                  {selectedTeam && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-semibold">{selectedTeam.franchiseName || selectedTeam.groupName}</span>{" "}
                        has{" "}
                        <span className="font-bold text-primary">
                          ₹{(selectedTeam.remainingBudget || 0).toFixed(1)} Cr
                        </span>{" "}
                        remaining with {selectedTeam.squadPlayerIds?.length || 0} players.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Sold Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Enter Sold Price (Crores)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      min={selectedPlayer?.basePrice || 0}
                      placeholder="Enter final bid amount..."
                      value={soldPrice}
                      onChange={(e) => setSoldPrice(e.target.value)}
                    />
                    {selectedPlayer && soldPrice && Number.parseFloat(soldPrice) < selectedPlayer.basePrice && (
                      <p className="text-xs text-destructive">Price must be at least the base price</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={handleMarkAsUnsold} 
                      disabled={!selectedPlayerId || markingUnsold}
                      variant="destructive"
                      size="lg"
                    >
                      <ListX className="h-4 w-4 mr-2" />
                      {markingUnsold ? 'Marking...' : 'Mark Unsold'}
                    </Button>
                    <Button 
                      onClick={handleConfirmSale} 
                      disabled={!canConfirmSale} 
                      size="lg"
                    >
                      <Gavel className="h-4 w-4 mr-2" />
                      Confirm Sale
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions - Now more visible on mobile */}
              <Card className="order-2 lg:order-0">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    <span>All Transactions</span>
                    {selectedTransactionId && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleUndoTransaction(selectedTransactionId)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Undo Selected
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>Click a transaction to select it for undo</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {recentTransactions.map((txn) => {
                        const player = players.find((p) => p.id === txn.playerId)
                        const team = teams.find((t) => t.id === txn.soldToTeam)
                        if (!player || !team) return null
                        const isSelected = selectedTransactionId === txn.id
                        return (
                          <div
                            key={txn.id}
                            onClick={() => setSelectedTransactionId(isSelected ? null : txn.id)}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border cursor-pointer transition-all gap-2 ${
                              isSelected 
                                ? 'bg-primary/10 border-primary shadow-md' 
                                : 'bg-card hover:bg-accent/5 hover:border-accent'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{player.name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {team.franchiseName || team.groupName}
                              </div>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                              <div className="font-bold text-primary">₹{txn.soldPrice} Cr</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(txn.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-6 order-3 lg:order-2">
              <Card>
                <CardHeader>
                  <CardTitle>Auction Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Players Sold</span>
                      <span className="font-bold">{players.filter((p) => p.status === "Sold").length}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(players.filter((p) => p.status === "Sold").length / players.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Remaining</span>
                      <span className="font-bold">{unsoldPlayers.length}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary transition-all"
                        style={{ width: `${(unsoldPlayers.length / players.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
                    <div className="text-2xl font-bold text-primary">
                      ₹{teams.reduce((sum, t) => sum + t.franchiseBid + (settings.initialBudget - t.remainingBudget - t.franchiseBid), 0).toFixed(1)}{" "}
                      Cr
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Available Budget</div>
                    <div className="text-2xl font-bold text-accent">
                      ₹{teams.reduce((sum, t) => sum + (t.remainingBudget || 0), 0).toFixed(1)} Cr
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Purchases</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">No purchases yet</div>
                  ) : (
                    <div className="space-y-3">
                      {transactions
                        .sort((a, b) => b.soldPrice - a.soldPrice)
                        .slice(0, 5)
                        .map((txn) => {
                          const player = players.find((p) => p.id === txn.playerId)
                          if (!player) return null
                          return (
                            <div key={txn.id} className="flex items-center justify-between">
                              <div className="flex-1 truncate">
                                <div className="font-medium text-sm truncate">{player.name}</div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {player.role}
                                </Badge>
                              </div>
                              <div className="font-bold text-primary ml-2">₹{txn.soldPrice} Cr</div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

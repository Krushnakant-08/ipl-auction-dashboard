"use client"

import { useState, useMemo } from "react"
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

export default function AuctionPage() {
  const {
    settings,
    players,
    teams,
    sellPlayer,
    undoLastTransaction,
    transactions,
    availableFranchises,
    assignFranchise,
    canStartPlayerAuction,
    startPlayerAuction,
  } = useAuction()

  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("")
  const [franchiseBid, setFranchiseBid] = useState<string>("")

  // Player auction state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [soldPrice, setSoldPrice] = useState<string>("")

  // RTM dialog state
  const [rtmPlayerId, setRtmPlayerId] = useState<string | null>(null)
  const [rtmOriginalTeamId, setRtmOriginalTeamId] = useState<string | null>(null)

  // Unsold players state
  const [markingUnsold, setMarkingUnsold] = useState(false)

  const unsoldPlayers = useMemo(() => players.filter((p) => p.status === "Unsold"), [players])
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId)
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

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
    return transactions.slice(-5).reverse()
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
                    onClick={handleStartPlayerAuction} 
                    className="w-full" 
                    size="lg"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {canStartPlayerAuction() ? "Start Player Auction" : "Start Player Auction Anyway"}
                  </Button>
                  
                  {!canStartPlayerAuction() && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Teams with franchises will participate, others will be skipped
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
                        {unsoldPlayers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No unsold players available
                          </div>
                        ) : (
                          unsoldPlayers.map((player) => (
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
                      step="0.1"
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
                    <span>Recent Transactions</span>
                    {transactions.length > 0 && (
                      <Button variant="outline" size="sm" onClick={undoLastTransaction}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Undo Last
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>Last 5 player sales</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((txn) => {
                        const player = players.find((p) => p.id === txn.playerId)
                        const team = teams.find((t) => t.id === txn.soldToTeam)
                        if (!player || !team) return null
                        return (
                          <div
                            key={txn.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors gap-2"
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

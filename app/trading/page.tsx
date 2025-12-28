"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuction } from "@/lib/auction-context"
import { useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RefreshCw, ArrowLeftRight, Clock, Check, X, AlertCircle, StopCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TradingPage() {
  const { user, isAdmin, isFranchise } = useAuth()
  const {
    settings,
    teams,
    players,
    trades,
    getTeamPlayers,
    proposeTrade,
    respondToTrade,
    cancelTrade,
    approveTrade,
    startTradingWindow,
    endTradingWindow,
  } = useAuction()

  const [durationMinutes, setDurationMinutes] = useState("30")
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [offeredPlayers, setOfferedPlayers] = useState<string[]>([])
  const [requestedPlayers, setRequestedPlayers] = useState<string[]>([])
  const [tradeMessage, setTradeMessage] = useState("")
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const isTradingActive = settings.currentPhase === "Trading Window"
  const timeRemaining = useMemo(() => {
    if (!settings.tradingWindowEnd) return null
    const end = new Date(settings.tradingWindowEnd)
    const diff = end.getTime() - currentTime
    if (diff <= 0) return "Expired"
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }, [settings.tradingWindowEnd, currentTime])

  const userTeam = isFranchise() && user?.teamId ? teams.find(t => t.id === user.teamId) : null
  const myPlayers = userTeam ? getTeamPlayers(userTeam.id) : []
  const targetTeamPlayers = selectedTeam ? getTeamPlayers(selectedTeam) : []

  const myTrades = useMemo(() => {
    // Admin sees all trades, franchise sees only their trades
    if (isAdmin()) return trades
    if (!userTeam) return []
    return trades.filter(t => t.proposedBy === userTeam.id || t.proposedTo === userTeam.id)
  }, [trades, userTeam, isAdmin])

  const pendingTrades = myTrades.filter(t => t.status === "Pending")
  const pendingApprovalTrades = myTrades.filter(t => t.status === "Pending Admin Approval")
  const completedTrades = myTrades.filter(t => t.status !== "Pending" && t.status !== "Pending Admin Approval")

  const handleStartTradingWindow = () => {
    const minutes = parseInt(durationMinutes)
    if (minutes > 0) {
      startTradingWindow(minutes)
    }
  }

  const handleEndTradingWindow = () => {
    endTradingWindow()
  }

  const handleProposeTrade = async () => {
    if (!userTeam || !selectedTeam) return
    
    const success = await proposeTrade(
      userTeam.id,
      selectedTeam,
      offeredPlayers,
      requestedPlayers,
      tradeMessage
    )

    if (success) {
      setSelectedTeam("")
      setOfferedPlayers([])
      setRequestedPlayers([])
      setTradeMessage("")
    }
  }

  const toggleOfferedPlayer = (playerId: string) => {
    setOfferedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const toggleRequestedPlayer = (playerId: string) => {
    setRequestedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Trading Window</h1>
              <p className="text-muted-foreground mt-1">Exchange players between teams</p>
            </div>
            <Badge variant={isTradingActive ? "default" : "secondary"} className="text-lg px-4 py-2">
              {isTradingActive ? (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {timeRemaining}
                </span>
              ) : (
                "Closed"
              )}
            </Badge>
          </div>
        </div>

        {/* Admin Control */}
        {isAdmin() && (
          <>
            {!isTradingActive ? (
              <Card className="mb-6 border-primary">
                <CardHeader className="bg-primary/5">
                  <CardTitle>Start Trading Window</CardTitle>
                  <CardDescription>Open the trading window for a specific duration</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        min="5"
                        step="5"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleStartTradingWindow} size="lg">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Open Trading Window
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-6 border-destructive">
                <CardHeader className="bg-destructive/5">
                  <CardTitle>Trading Window Active</CardTitle>
                  <CardDescription>Close the trading window manually</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Time Remaining</div>
                      <div className="text-2xl font-bold">{timeRemaining}</div>
                    </div>
                    <Button onClick={handleEndTradingWindow} variant="destructive" size="lg">
                      <StopCircle className="h-4 w-4 mr-2" />
                      End Trading Window
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!isTradingActive && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Trading window is currently closed. {isAdmin() && "Start the trading window to allow teams to exchange players."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Propose Trade */}
          {isFranchise() && isTradingActive && userTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Propose Trade
                </CardTitle>
                <CardDescription>Select players to trade with another team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Select Target Team */}
                <div className="space-y-2">
                  <Label>Trade With</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter(t => t.id !== userTeam.id && t.teamAuctionComplete)
                        .map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.franchiseName || team.groupName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Your Players */}
                <div className="space-y-2">
                  <Label>Your Players (Select to Offer)</Label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {myPlayers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No players in squad</p>
                    ) : (
                      myPlayers.map(player => (
                        <div
                          key={player.id}
                          onClick={() => toggleOfferedPlayer(player.id)}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            offeredPlayers.includes(player.id)
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{player.name}</span>
                            <Badge variant="outline">{player.role}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {offeredPlayers.length} player(s) selected
                  </p>
                </div>

                {/* Target Team Players */}
                {selectedTeam && (
                  <div className="space-y-2">
                    <Label>Request Players From {teams.find(t => t.id === selectedTeam)?.franchiseName}</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                      {targetTeamPlayers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No players in squad</p>
                      ) : (
                        targetTeamPlayers.map(player => (
                          <div
                            key={player.id}
                            onClick={() => toggleRequestedPlayer(player.id)}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              requestedPlayers.includes(player.id)
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{player.name}</span>
                              <Badge variant="outline">{player.role}</Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {requestedPlayers.length} player(s) selected
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Input
                    placeholder="Add a note to your trade offer..."
                    value={tradeMessage}
                    onChange={(e) => setTradeMessage(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleProposeTrade}
                  disabled={!selectedTeam || offeredPlayers.length === 0 || requestedPlayers.length === 0}
                  className="w-full"
                  size="lg"
                >
                  Propose Trade
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Active Trade Offers */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Trades</CardTitle>
              <CardDescription>
                {isFranchise() ? "Trade offers for your team" : "All pending trades"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No pending trades</div>
              ) : (
                <div className="space-y-4">
                  {pendingTrades.map(trade => {
                    const isProposer = userTeam && trade.proposedBy === userTeam.id
                    const canRespond = userTeam && trade.proposedTo === userTeam.id

                    return (
                      <Card key={trade.id}>
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{trade.proposedByName}</div>
                              <div className="text-sm text-muted-foreground">to {trade.proposedToName}</div>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="font-medium mb-1">Offering:</div>
                              {trade.offeredPlayers.map(pid => {
                                const player = players.find(p => p.id === pid)
                                return <div key={pid} className="text-muted-foreground">{player?.name}</div>
                              })}
                            </div>
                            <div>
                              <div className="font-medium mb-1">Requesting:</div>
                              {trade.requestedPlayers.map(pid => {
                                const player = players.find(p => p.id === pid)
                                return <div key={pid} className="text-muted-foreground">{player?.name}</div>
                              })}
                            </div>
                          </div>

                          {trade.message && (
                            <div className="text-sm italic text-muted-foreground border-l-2 pl-2">
                              "{trade.message}"
                            </div>
                          )}

                          <div className="flex gap-2">
                            {canRespond && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => respondToTrade(trade.id, true)}
                                  className="flex-1"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => respondToTrade(trade.id, false)}
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {isProposer && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => cancelTrade(trade.id, userTeam.id)}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Approval Section */}
          {isAdmin() && pendingApprovalTrades.length > 0 && (
            <Card className="border-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle>Trades Awaiting Approval</CardTitle>
                <CardDescription>Both franchises have agreed - approve to complete</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {pendingApprovalTrades.map(trade => (
                    <Card key={trade.id}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{trade.proposedByName}</div>
                            <div className="text-sm text-muted-foreground">to {trade.proposedToName}</div>
                          </div>
                          <Badge className="bg-orange-500">Awaiting Approval</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="font-medium mb-1">Offering:</div>
                            {trade.offeredPlayers.map(pid => {
                              const player = players.find(p => p.id === pid)
                              return <div key={pid} className="text-muted-foreground">{player?.name}</div>
                            })}
                          </div>
                          <div>
                            <div className="font-medium mb-1">Requesting:</div>
                            {trade.requestedPlayers.map(pid => {
                              const player = players.find(p => p.id === pid)
                              return <div key={pid} className="text-muted-foreground">{player?.name}</div>
                            })}
                          </div>
                        </div>

                        {trade.message && (
                          <div className="text-sm italic text-muted-foreground border-l-2 pl-2">
                            "{trade.message}"
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveTrade(trade.id, true)}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve Trade
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => approveTrade(trade.id, false)}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject Trade
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trade History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Completed and cancelled trades</CardDescription>
            </CardHeader>
            <CardContent>
              {completedTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No completed trades</div>
              ) : (
                <div className="space-y-3">
                  {completedTrades.map(trade => (
                    <div key={trade.id} className="flex flex-col gap-2 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {trade.proposedByName} ↔ {trade.proposedToName}
                        </div>
                        <Badge
                          variant={
                            trade.status === "Accepted" ? "default" :
                            trade.status === "Rejected" ? "destructive" :
                            "secondary"
                          }
                        >
                          {trade.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-1">
                          <div className="text-muted-foreground mb-1">Offered:</div>
                          <div className="flex flex-wrap gap-1">
                            {trade.offeredPlayerNames?.map((name, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {name}
                              </Badge>
                            )) || trade.offeredPlayers.map((pid, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {players.find(p => p.id === pid)?.name || 'Unknown'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        
                        <div className="flex-1">
                          <div className="text-muted-foreground mb-1">Requested:</div>
                          <div className="flex flex-wrap gap-1">
                            {trade.requestedPlayerNames?.map((name, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {name}
                              </Badge>
                            )) || trade.requestedPlayers.map((pid, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {players.find(p => p.id === pid)?.name || 'Unknown'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {trade.message && (
                        <div className="text-xs text-muted-foreground italic">
                          Message: {trade.message}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(trade.proposedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useAuction } from "@/lib/auction-context"
import { useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Users, DollarSign, Globe, RefreshCw, Shield } from "lucide-react"
import { useState } from "react"
import { RTSDialog } from "@/components/rts-dialog"
import { RTMSquadDialog } from "@/components/rtm-squad-dialog"
import { StartingXISelector } from "@/components/starting-xi-selector"
import { Button } from "@/components/ui/button"

export default function SquadsPage() {
  const { teams, getTeamPlayers, canUseRTS, players, settings } = useAuction()
  const { user } = useAuth()
  const [rtsTeamId, setRtsTeamId] = useState<string | null>(null)
  const [rtmTeamId, setRtmTeamId] = useState<string | null>(null)
  const [startingXITeamId, setStartingXITeamId] = useState<string | null>(null)

  // Filter teams based on user role
  const visibleTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.teamId)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <RTSDialog teamId={rtsTeamId} open={!!rtsTeamId} onClose={() => setRtsTeamId(null)} />
      <RTMSquadDialog teamId={rtmTeamId} open={!!rtmTeamId} onClose={() => setRtmTeamId(null)} />
      {startingXITeamId && (
        <StartingXISelector teamId={startingXITeamId} open={true} onClose={() => setStartingXITeamId(null)} />
      )}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {user?.role === "admin" ? "Team Squads" : "My Squad"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "admin" ? "View players bought by each team" : "View your team's squad details"}
          </p>
        </div>

        <Tabs defaultValue={visibleTeams[0]?.id} className="space-y-6">
          {user?.role === "admin" && (
            <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted/50 p-2">
              {visibleTeams.map((team) => (
                <TabsTrigger key={team.id} value={team.id} className="flex items-center gap-2">
                  <div className="relative h-5 w-5 rounded-full overflow-hidden">
                    <Image
                      src={team.logo || "/placeholder.svg"}
                      alt={team.franchiseName || team.groupName}
                      fill
                      className="object-cover"
                      sizes="20px"
                    />
                  </div>
                  <span>{team.franchiseName || team.groupName}</span>
                  <Badge variant="secondary" className="ml-1">
                    {getTeamPlayers(team.id).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {visibleTeams.map((team) => {
            const teamPlayers = getTeamPlayers(team.id)
            const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.purchasePrice || 0), 0)
            const overseasCount = teamPlayers.filter((p) => p.country !== "India").length
            const rtsValidation = canUseRTS(team.id)

            return (
              <TabsContent key={team.id} value={team.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{team.franchiseName || team.groupName}</h2>
                    <div className="flex gap-2 mt-1">
                      {team.rtsUsed && (
                        <Badge variant="outline">
                          RTS Used
                        </Badge>
                      )}
                      {team.rtmUsed && (
                        <Badge variant="outline">
                          RTM Used
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === "admin" && (
                      <>
                        <Button
                          onClick={() => setRtsTeamId(team.id)}
                          disabled={!rtsValidation.can}
                          variant="outline"
                          size="lg"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Use RTS
                        </Button>
                        <Button
                          onClick={() => setRtmTeamId(team.id)}
                          disabled={team.rtmUsed}
                          variant="outline"
                          size="lg"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Use RTM
                        </Button>
                      </>
                    )}
                    {/* Starting XI button available after trading window ends */}
                    {(settings.currentPhase === "Finalization" || team.startingXI.length > 0) && 
                     (user?.role === "franchise" && user?.teamId === team.id || user?.role === "admin") && (
                      <Button
                        onClick={() => setStartingXITeamId(team.id)}
                        disabled={teamPlayers.length < 11}
                        variant={team.startingXI.length === 11 ? "default" : "outline"}
                        size="lg"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {team.startingXI.length === 11 ? "Edit" : "Select"} Starting XI
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Total Players
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamPlayers.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Spent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">₹{totalSpent.toFixed(1)} Cr</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Overseas Players
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-secondary">{overseasCount}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div>
                        <CardTitle>Remaining Purse</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-accent">
                        ₹{team.remainingBudget.toFixed(1)} Cr
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>Squad Roster</CardTitle>
                      <CardDescription>All players bought by {team.franchiseName || team.groupName}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamPlayers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No players bought yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Player Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Country</TableHead>
                              <TableHead className="text-right">Base Price</TableHead>
                              <TableHead className="text-right">Purchase Price</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamPlayers.map((player) => {
                              const value = (player.purchasePrice || 0) - player.basePrice
                              const isOverpaid = value > 0
                              return (
                                <TableRow key={player.id}>
                                  <TableCell className="font-medium">{player.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{player.role}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={player.country === "India" ? "default" : "secondary"}>
                                      {player.country}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    ₹{player.basePrice} Cr
                                  </TableCell>
                                  <TableCell className="text-right font-medium">₹{player.purchasePrice} Cr</TableCell>
                                  <TableCell className="text-right">
                                    <span className={isOverpaid ? "text-destructive" : "text-accent"}>
                                      {isOverpaid ? "+" : ""}₹{value.toFixed(1)} Cr
                                    </span>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>

                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg border bg-card">
                            <div className="text-sm text-muted-foreground mb-1">Batsmen</div>
                            <div className="text-2xl font-bold">
                              {teamPlayers.filter((p) => p.role === "Batsman").length}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <div className="text-sm text-muted-foreground mb-1">Bowlers</div>
                            <div className="text-2xl font-bold">
                              {teamPlayers.filter((p) => p.role === "Bowler").length}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <div className="text-sm text-muted-foreground mb-1">All-Rounders</div>
                            <div className="text-2xl font-bold">
                              {teamPlayers.filter((p) => p.role === "All-rounder").length}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </main>
    </div>
  )
}

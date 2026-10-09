"use client"

import { useAuction } from "@/lib/auction-context"
import { useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { Users, AlertCircle, CheckCircle2, Shield } from "lucide-react"

export default function StartingXIPage() {
  const { teams, players, getTeamPlayers } = useAuction()
  const { user } = useAuth()

  // Filter teams based on user role
  const visibleTeams = user?.role === "admin" ? teams : teams.filter((t) => t.id === user?.teamId)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            {user?.role === "admin" ? "All Starting XIs" : "My Starting XI"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "admin" 
              ? "View the starting XI submissions from all franchises" 
              : "View your submitted starting XI"}
          </p>
        </div>

        <Tabs defaultValue={visibleTeams[0]?.id} className="space-y-6">
          {user?.role === "admin" && (
            <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted/50 p-2">
              {visibleTeams.map((team) => {
                const hasSubmitted = team.startingXI && team.startingXI.length === 11
                return (
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
                    {hasSubmitted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          )}

          {visibleTeams.map((team) => {
            const startingXIPlayers = players.filter(p => team.startingXI?.includes(p.id))
            const hasSubmitted = team.startingXI && team.startingXI.length === 11

            return (
              <TabsContent key={team.id} value={team.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{team.franchiseName || team.groupName}</h2>
                    <div className="flex gap-2 mt-1">
                      {hasSubmitted ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Starting XI Submitted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Not Submitted
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {!hasSubmitted ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {team.franchiseName || team.groupName} has not submitted their starting XI yet.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Starting XI
                      </CardTitle>
                      <CardDescription>
                        Top 11 players selected by {team.franchiseName || team.groupName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {startingXIPlayers.map((player, index) => (
                          <div
                            key={player.id}
                            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{player.name}</div>
                                <div className="flex gap-1 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {player.role}
                                  </Badge>
                                  <Badge 
                                    variant={player.country === "India" ? "default" : "secondary"} 
                                    className="text-xs"
                                  >
                                    {player.country}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  ₹{player.purchasePrice?.toFixed(2)} Cr
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Team Composition Stats */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 rounded-lg border bg-card">
                          <div className="text-xs text-muted-foreground mb-1">Batsmen</div>
                          <div className="text-xl font-bold">
                            {startingXIPlayers.filter((p) => p.role === "Batsman").length}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-card">
                          <div className="text-xs text-muted-foreground mb-1">Bowlers</div>
                          <div className="text-xl font-bold">
                            {startingXIPlayers.filter((p) => p.role === "Bowler").length}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-card">
                          <div className="text-xs text-muted-foreground mb-1">All-Rounders</div>
                          <div className="text-xl font-bold">
                            {startingXIPlayers.filter((p) => p.role === "All-rounder").length}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-card">
                          <div className="text-xs text-muted-foreground mb-1">Overseas</div>
                          <div className="text-xl font-bold">
                            {startingXIPlayers.filter((p) => p.country !== "India").length}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </main>
    </div>
  )
}

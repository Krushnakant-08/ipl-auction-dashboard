"use client"

import { useAuction } from "@/lib/auction-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingDown } from "lucide-react"
import Image from "next/image"

export default function TeamsPage() {
  const { teams, settings, players } = useAuction()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teams Management</h1>
            <p className="text-muted-foreground mt-1">Monitor team budgets and squad composition</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
            <CardDescription>Real-time team statistics and budget tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Total Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-center">Players</TableHead>
                    <TableHead className="text-center">Overseas</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => {
                    const totalBudget = settings.initialBudget
                    const spent =
                      team.franchiseBid +
                      team.squadPlayerIds.reduce((sum, playerId) => {
                        const player = players.find((p) => p.id === playerId)
                        return sum + (player?.purchasePrice || 0)
                      }, 0)
                    const remaining = team.remainingBudget
                    const playersCount = team.squadPlayerIds.length
                    const overseasCount = team.squadPlayerIds.filter((playerId) => {
                      const player = players.find((p) => p.id === playerId)
                      return player && player.country !== "India"
                    }).length

                    const isLowBudget = remaining < 10
                    const isPlayersAtLimit = playersCount >= settings.maxSquadSize

                    return (
                      <TableRow
                        key={team.id}
                        className={isLowBudget || isPlayersAtLimit ? "bg-destructive/5" : undefined}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                              <Image
                                src={team.logo || "/placeholder.svg"}
                                alt={team.franchiseName || team.groupName}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{team.franchiseName || team.groupName}</span>
                              {team.franchiseName && (
                                <span className="text-xs text-muted-foreground">{team.groupName}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{totalBudget} Cr</TableCell>
                        <TableCell className="text-right">₹{spent.toFixed(1)} Cr</TableCell>
                        <TableCell className="text-right">
                          <span className={isLowBudget ? "text-destructive font-semibold" : "font-medium"}>
                            ₹{remaining.toFixed(1)} Cr
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isPlayersAtLimit ? "destructive" : "secondary"}>
                            {playersCount} / {settings.maxSquadSize}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{overseasCount}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!team.teamAuctionComplete && <Badge variant="secondary">Pending Franchise</Badge>}
                            {team.teamAuctionComplete && isLowBudget && (
                              <Badge variant="destructive" className="gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Low Budget
                              </Badge>
                            )}
                            {team.teamAuctionComplete && isPlayersAtLimit && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Full Squad
                              </Badge>
                            )}
                            {team.teamAuctionComplete && !isLowBudget && !isPlayersAtLimit && (
                              <Badge variant="outline" className="text-accent">
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{teams.length * settings.initialBudget} Cr</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ₹
                {teams
                  .reduce((sum, t) => {
                    const franchiseBid = t.franchiseBid || 0
                    const playerSpend = t.squadPlayerIds.reduce((pSum, pId) => {
                      const player = players.find((p) => p.id === pId)
                      return pSum + (player?.purchasePrice || 0)
                    }, 0)
                    return sum + franchiseBid + playerSpend
                  }, 0)
                  .toFixed(1)}{" "}
                Cr
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                ₹{teams.reduce((sum, t) => sum + t.remainingBudget, 0).toFixed(1)} Cr
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

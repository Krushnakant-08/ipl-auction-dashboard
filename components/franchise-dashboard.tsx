"use client"

import { useMemo } from "react"
import { useAuction } from "@/lib/auction-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Users, TrendingUp, Trophy, Globe } from "lucide-react"
import Image from "next/image"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts"

export function FranchiseDashboard() {
  const { user } = useAuth()
  const { teams, players, settings, getTeamPlayers } = useAuction()

  const myTeam = teams.find((t) => t.id === user?.teamId)
  const myPlayers = useMemo(() => {
    if (!myTeam) return []
    return getTeamPlayers(myTeam.id)
  }, [myTeam, getTeamPlayers])

  const stats = useMemo(() => {
    if (!myTeam) return null

    // Use the database remainingBudget which already accounts for franchise bid, player purchases, RTM, and RTS costs
    const remainingBudget = myTeam.remainingBudget
    const totalSpent = settings.initialBudget - remainingBudget
    const avgPrice = myPlayers.length > 0 ? myPlayers.reduce((sum, p) => sum + (p.purchasePrice || 0), 0) / myPlayers.length : 0
    const overseasCount = myPlayers.filter((p) => p.country !== "India").length
    const budgetUsedPercent = totalSpent > 0 ? (totalSpent / settings.initialBudget) * 100 : 0

    return {
      totalSpent,
      remainingBudget,
      squadSize: myPlayers.length,
      maxSquadSize: settings.maxSquadSize,
      avgPrice,
      overseasCount,
      budgetUsedPercent,
      franchiseBid: myTeam.franchiseBid,
    }
  }, [myTeam, myPlayers, settings])

  const roleDistribution = useMemo(() => {
    const roles = ["Batsman", "Bowler", "All-rounder"] as const
    return roles.map((role) => ({
      name: role,
      count: myPlayers.filter((p) => p.role === role).length,
    }))
  }, [myPlayers])

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

  if (!myTeam || !stats) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Team not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted border-4 border-primary/20">
              <Image
                src={myTeam.logo || "/placeholder.svg"}
                alt={myTeam.franchiseName || "Team"}
                fill
                className="object-contain"
                sizes="96px"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-1">{myTeam.franchiseName}</h2>
              <p className="text-muted-foreground mb-3">{myTeam.groupName}</p>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm">
                  Franchise Bid: ₹{stats.franchiseBid} Cr
                </Badge>
                <Badge variant={myTeam.rtmUsed ? "secondary" : "outline"} className="text-sm">
                  RTM: {myTeam.rtmUsed ? "Used" : "Available"}
                </Badge>
                <Badge variant={myTeam.rtsUsed ? "secondary" : "outline"} className="text-sm">
                  RTS: {myTeam.rtsUsed ? "Used" : "Available"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Remaining Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">₹{stats.remainingBudget.toFixed(1)} Cr</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.budgetUsedPercent.toFixed(1)}% budget used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Squad Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.squadSize} / {stats.maxSquadSize}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.maxSquadSize - stats.squadSize} slots remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">₹{stats.totalSpent.toFixed(1)} Cr</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ₹{stats.avgPrice.toFixed(2)} Cr per player
            </p>
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
            <div className="text-3xl font-bold">{stats.overseasCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {myPlayers.length - stats.overseasCount} Indian players
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Squad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Your squad composition by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-62.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleDistribution}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle>Most Expensive Acquisitions</CardTitle>
            <CardDescription>Your top 5 highest-paid players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myPlayers
                .sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0))
                .slice(0, 5)
                .map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {player.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">₹{player.purchasePrice} Cr</div>
                      <Badge variant="outline" className="text-xs">
                        {player.country}
                      </Badge>
                    </div>
                  </div>
                ))}
              {myPlayers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No players in squad yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Squad Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Complete Squad</CardTitle>
          <CardDescription>All players in your team</CardDescription>
        </CardHeader>
        <CardContent>
          {myPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{player.role}</Badge>
                      </TableCell>
                      <TableCell>{player.country}</TableCell>
                      <TableCell className="text-right font-medium">₹{player.purchasePrice} Cr</TableCell>
                      {/* <TableCell className="text-center">
                        <Badge variant="secondary">{player.ratings.overall}</Badge>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No players in your squad yet</p>
              <p className="text-sm text-muted-foreground mt-2">Players will appear here once the auction begins</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

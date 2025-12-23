"use client"

import { useMemo } from "react"
import { useAuction } from "@/lib/auction-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Users, TrendingUp, Percent, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Legend, Cell } from "recharts"
import { AuctionHistory } from "@/components/auction-history"

export default function DashboardPage() {
  const { teams, players, getTeamPlayers } = useAuction()

  const stats = useMemo(() => {
    const soldPlayers = players.filter((p) => p.status === "Sold")
    const totalSpent = teams.reduce((sum, t) => sum + t.spent, 0)
    const avgPrice = soldPlayers.length > 0 ? totalSpent / soldPlayers.length : 0

    return {
      totalSpent,
      playersSold: soldPlayers.length,
      remainingPlayers: players.length - soldPlayers.length,
      avgPrice,
    }
  }, [teams, players])

  const teamSpendingData = useMemo(() => {
    return teams.map((team) => ({
      name: team.name ? team.name.split(" ")[0] : "Unknown", // Shortened name for chart
      spent: team.spent,
      remaining: team.totalBudget - team.spent,
    }))
  }, [teams])

  const roleDistributionData = useMemo(() => {
    const soldPlayers = players.filter((p) => p.status === "Sold")
    const roles = ["Batsman", "Bowler", "All-Rounder", "Wicketkeeper"] as const
    return roles.map((role) => ({
      name: role,
      value: soldPlayers.filter((p) => p.role === role).length,
    }))
  }, [players])

  const countryDistributionData = useMemo(() => {
    const soldPlayers = players.filter((p) => p.status === "Sold")
    return [
      { name: "India", value: soldPlayers.filter((p) => p.country === "India").length },
      { name: "Overseas", value: soldPlayers.filter((p) => p.country === "Overseas").length },
    ]
  }, [players])

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of auction statistics and analytics</p>
          </div>
          <Link href="/auction">
            <Button className="gap-2">
              Start Auction
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Auction Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{stats.totalSpent.toFixed(1)} Cr</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.totalSpent / (teams.length * teams[0]?.totalBudget || 1)) * 100).toFixed(1)}% of total budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Players Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{stats.playersSold}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.remainingPlayers} players remaining</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Player Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">₹{stats.avgPrice.toFixed(2)} Cr</div>
              <p className="text-xs text-muted-foreground mt-1">Per player sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Auction Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{((stats.playersSold / players.length) * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.playersSold} of {players.length} players
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Team Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Team-wise Spending</CardTitle>
              <CardDescription>Budget used vs remaining for each team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamSpendingData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Legend />
                    <Bar dataKey="spent" fill="hsl(var(--chart-1))" name="Spent" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="remaining" fill="hsl(var(--chart-2))" name="Remaining" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Role Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>Players sold by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Country Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Country Distribution</CardTitle>
              <CardDescription>Indian vs Overseas players sold</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {countryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Purchases */}
          <Card>
            <CardHeader>
              <CardTitle>Most Expensive Purchases</CardTitle>
              <CardDescription>Top 5 highest-paid players</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players
                  .filter((p) => p.status === "Sold")
                  .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
                  .slice(0, 5)
                  .map((player, index) => {
                    const team = teams.find((t) => t.id === player.soldTo)
                    return (
                      <div key={player.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-muted-foreground">{team?.name || "Unknown"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">₹{player.soldPrice} Cr</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </div>
                      </div>
                    )
                  })}
                {stats.playersSold === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No players sold yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auction History Panel */}
        <AuctionHistory />
      </main>
    </div>
  )
}

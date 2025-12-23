"use client"

import { useState, useMemo } from "react"
import { useAuction } from "@/lib/auction-context"
import { useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import type { PlayerRole, PlayerStatus } from "@/lib/types"

export default function PlayersPage() {
  const { players, teams } = useAuction()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "all">("all")
  const [countryFilter, setCountryFilter] = useState<string | "all">("all")
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | "all">("all")

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "all" || player.role === roleFilter
      const matchesCountry = 
        countryFilter === "all" || 
        (countryFilter === "India" && player.country === "India") ||
        (countryFilter === "Overseas" && player.country !== "India")
      const matchesStatus = statusFilter === "all" || player.status === statusFilter
      return matchesSearch && matchesRole && matchesCountry && matchesStatus
    })
  }, [players, searchQuery, roleFilter, countryFilter, statusFilter])

  const stats = useMemo(() => {
    return {
      total: players.length,
      sold: players.filter((p) => p.status === "Sold").length,
      unsold: players.filter((p) => p.status === "Unsold").length,
    }
  }, [players])

  const getRoleBadgeVariant = (role: PlayerRole) => {
    switch (role) {
      case "Batsman":
        return "default"
      case "Bowler":
        return "secondary"
      case "All-rounder":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: PlayerStatus) => {
    switch (status) {
      case "Sold":
        return "default"
      case "Unsold":
        return "secondary"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Player Pool</h1>
          <p className="text-muted-foreground mt-1">Browse and filter all players in the auction</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.sold}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unsold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.unsold}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Players</CardTitle>
            <CardDescription>Filter and search through the player pool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as PlayerRole | "all")}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Batsman">Batsman</SelectItem>
                    <SelectItem value="Bowler">Bowler</SelectItem>
                    <SelectItem value="All-rounder">All-rounder</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={countryFilter} onValueChange={(value) => setCountryFilter(value)}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Overseas">Overseas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PlayerStatus | "all")}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Unsold">Unsold</SelectItem>
                    <SelectItem value="Sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Base Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sold To</TableHead>
                    <TableHead className="text-right">Sold Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No players found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => {
                      const team = player.currentTeam ? teams.find((t) => t.id === player.currentTeam) : null
                      // Franchises can only see their own team's players' sold prices
                      const canSeeSoldPrice = user?.role === "admin" || player.currentTeam === user?.teamId
                      return (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(player.role)}>{player.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={player.country === "India" ? "outline" : "secondary"}>
                              {player.country}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">₹{player.basePrice} Cr</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(player.status)}>{player.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {canSeeSoldPrice && team 
                              ? (team.franchiseName || team.groupName)
                              : player.status === "Sold" 
                              ? "●●●●●" 
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {player.purchasePrice
                              ? canSeeSoldPrice
                                ? `₹${player.purchasePrice} Cr`
                                : "●●●●"
                              : "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredPlayers.length} of {players.length} players
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

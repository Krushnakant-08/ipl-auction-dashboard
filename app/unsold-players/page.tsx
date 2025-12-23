"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ListX, Trash2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UnsoldPlayer {
  id: string
  playerId: string
  playerName: string
  role: string
  country: string
  basePrice: number
  originalTeam: string | null
  auctionRound: number
  insertOrder: number
  timestamp: string
}

export default function UnsoldPlayersPage() {
  const [unsoldPlayers, setUnsoldPlayers] = useState<UnsoldPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUnsoldPlayers = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/unsold-players')
      if (response.ok) {
        const data = await response.json()
        setUnsoldPlayers(data)
      }
    } catch (error) {
      console.error('Error fetching unsold players:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleClearList = async () => {
    if (!confirm('Are you sure you want to clear the entire unsold players list?')) {
      return
    }

    try {
      const response = await fetch('/api/unsold-players', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-all' }),
      })

      if (response.ok) {
        setUnsoldPlayers([])
        alert('Unsold players list cleared')
      }
    } catch (error) {
      console.error('Error clearing unsold players:', error)
      alert('Failed to clear unsold players list')
    }
  }

  useEffect(() => {
    fetchUnsoldPlayers()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ListX className="h-8 w-8 text-destructive" />
                Unsold Players List
              </h1>
              <p className="text-muted-foreground mt-1">
                Players in auction order who remain unsold
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchUnsoldPlayers}
                disabled={refreshing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleClearList}
                disabled={unsoldPlayers.length === 0}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear List
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Unsold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{unsoldPlayers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  First Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {unsoldPlayers[0]?.playerName || '-'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Base Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ₹{unsoldPlayers.reduce((sum, p) => sum + p.basePrice, 0).toFixed(1)} Cr
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unsold Players Table */}
          <Card>
            <CardHeader>
              <CardTitle>Unsold Players (In Auction Order)</CardTitle>
              <CardDescription>
                Players are listed in the order they were added to the auction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : unsoldPlayers.length === 0 ? (
                <Alert>
                  <ListX className="h-4 w-4" />
                  <AlertDescription>
                    No unsold players list created yet. Go to the Auction page and click
                    "Create Unsold Players List" to generate this list.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Order</TableHead>
                        <TableHead>Player Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Original Team</TableHead>
                        <TableHead>Round</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unsoldPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-mono font-bold">
                            #{player.insertOrder}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {player.playerName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{player.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={player.country === 'India' ? 'default' : 'secondary'}>
                              {player.country}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{player.basePrice} Cr
                          </TableCell>
                          <TableCell>
                            {player.originalTeam ? (
                              <Badge variant="outline">{player.originalTeam}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge>{player.auctionRound}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

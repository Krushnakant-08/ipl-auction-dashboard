"use client"

import { useAuction } from "@/lib/auction-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"
import Image from "next/image"

export function AuctionHistory() {
  const { transactions, players, teams } = useAuction()

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Auction History
          </CardTitle>
          <CardDescription>Complete transaction log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Auction History
        </CardTitle>
        <CardDescription>Complete transaction log</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions
                .slice()
                .reverse()
                .map((txn) => {
                  const player = players.find((p) => p.id === txn.playerId)
                  const team = teams.find((t) => t.id === txn.teamId)

                  if (!player || !team) return null

                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(txn.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {player.role}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {player.country}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="relative h-6 w-6 rounded-full overflow-hidden">
                            <Image
                              src={team.logo || "/placeholder.svg"}
                              alt={team.name}
                              fill
                              className="object-cover"
                              sizes="24px"
                            />
                          </div>
                          <span className="text-sm font-medium">{team.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">₹{txn.price} Cr</TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

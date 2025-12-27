"use client"

import { useAuction } from "@/lib/auction-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft } from "lucide-react"

export function TradingHistory() {
  const { trades } = useAuction()

  const completedTrades = trades.filter(t => t.status === "Accepted")

  if (completedTrades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Trading History
          </CardTitle>
          <CardDescription>Completed player exchanges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No trades completed yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Trading History
        </CardTitle>
        <CardDescription>Completed player exchanges between teams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Team A</TableHead>
                <TableHead>Gave</TableHead>
                <TableHead className="text-center">⇄</TableHead>
                <TableHead>Team B</TableHead>
                <TableHead>Gave</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTrades
                .slice()
                .reverse()
                .map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(trade.proposedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{trade.proposedByName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {trade.offeredPlayerNames?.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs w-fit">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{trade.proposedToName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {trade.requestedPlayerNames?.map((name, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs w-fit">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">
                        {trade.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

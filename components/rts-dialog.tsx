"use client"

import { useState } from "react"
import { useAuction } from "@/lib/auction-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"

interface RTSDialogProps {
  teamId: string | null
  open: boolean
  onClose: () => void
}

export function RTSDialog({ teamId, open, onClose }: RTSDialogProps) {
  const { getTeamById, getTeamPlayers, canUseRTS, useRTS: executeRTS } = useAuction()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const team = teamId ? getTeamById(teamId) : null
  const teamPlayers = teamId ? getTeamPlayers(teamId) : []
  const selectedPlayer = teamPlayers.find((p) => p.id === selectedPlayerId)

  const validation = { can: false, reason: "" } // Initialize validation at the top level

  const handleUseRTS = async () => {
    if (!selectedPlayerId || !teamId) return

    setIsProcessing(true)
    const success = await executeRTS(selectedPlayerId, teamId)
    setIsProcessing(false)

    if (success) {
      setSelectedPlayerId("")
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedPlayerId("")
    onClose()
  }

  if (!team) return null

  if (teamId) {
    const validationResult = canUseRTS(teamId)
    validation.can = validationResult.can
    validation.reason = validationResult.reason ?? ""
  }

  return (
    <Dialog open={open} onOpenChange={() => handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Right To Sell
          </DialogTitle>
          <DialogDescription>
            {team.franchiseName || team.groupName} can return a player to the auction pool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!validation.can ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validation.reason}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="rts-player">Select Player to Return</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger id="rts-player">
                    <SelectValue placeholder="Choose a player..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamPlayers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No players in squad</div>
                    ) : (
                      teamPlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium">{player.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {player.role}
                              </Badge>
                              <span className="text-xs text-muted-foreground">₹{player.purchasePrice} Cr</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlayer && (
                <div className="p-4 rounded-lg border bg-accent/5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Player</div>
                      <div className="font-semibold">{selectedPlayer.name}</div>
                      <Badge variant="outline" className="mt-1">
                        {selectedPlayer.role}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Refund Amount</div>
                      <div className="text-2xl font-bold text-accent">₹{selectedPlayer.purchasePrice} Cr</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Budget After RTS</div>
                    <div className="text-lg font-bold">
                      ₹{(team.remainingBudget + (selectedPlayer.purchasePrice || 0)).toFixed(1)} Cr
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleUseRTS}
            disabled={!validation.can || !selectedPlayerId || isProcessing}
            variant="destructive"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Use RTS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

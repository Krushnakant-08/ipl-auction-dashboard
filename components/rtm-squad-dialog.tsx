"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

interface RTMSquadDialogProps {
  teamId: string | null
  open: boolean
  onClose: () => void
}

export function RTMSquadDialog({ teamId, open, onClose }: RTMSquadDialogProps) {
  const { getTeamById, players, canUseRTM, useRTM: executeRTM, getPlayerById } = useAuction()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  const team = teamId ? getTeamById(teamId) : null

  // Find all eligible players for RTM (players originally from this team, now sold to other teams)
  // Note: originalTeam field contains franchise names, not team IDs
  const eligiblePlayers = players.filter((p) => {
    if (!team || !team.franchiseName) return false
    
    // Match by franchise name since originalTeam stores franchise names
    return (
      p.originalTeam === team.franchiseName &&
      p.currentTeam && 
      p.currentTeam !== teamId && 
      p.status === "Sold"
    )
  })

  const selectedPlayer = selectedPlayerId ? getPlayerById(selectedPlayerId) : null
  const currentOwner = selectedPlayer?.currentTeam ? getTeamById(selectedPlayer.currentTeam) : null

  useEffect(() => {
    if (open && eligiblePlayers.length > 0) {
      setSelectedPlayerId(eligiblePlayers[0].id)
    } else {
      setSelectedPlayerId("")
    }
  }, [open, teamId])

  const handleUseRTM = async () => {
    if (!selectedPlayerId || !teamId) return

    setIsProcessing(true)
    const success = await executeRTM(selectedPlayerId, teamId)
    setIsProcessing(false)

    if (success) {
      onClose()
    }
  }

  const validation = selectedPlayerId && teamId ? canUseRTM(selectedPlayerId, teamId) : { can: false, reason: "" }

  if (!team) return null

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Use Right To Match (RTM)
          </DialogTitle>
          <DialogDescription>
            Select a player to bring back to {team.franchiseName || team.groupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {eligiblePlayers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No eligible players found. Players must be originally from this team and currently sold to another team.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="rtm-player">Select Player to Match</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger id="rtm-player">
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligiblePlayers.map((player) => {
                      const owner = player.currentTeam ? getTeamById(player.currentTeam) : null
                      return (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center gap-2">
                            <span>{player.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {player.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              @ {owner?.franchiseName || owner?.groupName}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlayer && currentOwner && (
                <div className="space-y-3">
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
                        <div className="text-xs text-muted-foreground mb-1">Purchase Price</div>
                        <div className="text-2xl font-bold text-primary">₹{selectedPlayer.purchasePrice} Cr</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1">Current Owner</div>
                      <div className="font-medium">{currentOwner.franchiseName || currentOwner.groupName}</div>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1">Original Team</div>
                      <div className="font-medium">{team.franchiseName || team.groupName}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">Budget After RTM</div>
                    <div className="text-lg font-bold">
                      ₹{(team.remainingBudget - (selectedPlayer.purchasePrice || 0)).toFixed(1)} Cr
                    </div>
                  </div>
                </div>
              )}

              {!validation.can && validation.reason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validation.reason}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleUseRTM}
            disabled={!validation.can || isProcessing || eligiblePlayers.length === 0}
          >
            <Shield className="h-4 w-4 mr-2" />
            Use RTM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

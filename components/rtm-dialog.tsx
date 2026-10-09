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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

interface RTMDialogProps {
  playerId: string | null
  originalTeamId: string | null
  onClose: () => void
}

export function RTMDialog({ playerId, originalTeamId, onClose }: RTMDialogProps) {
  const { getPlayerById, getTeamById, canUseRTM, useRTM: executeRTM } = useAuction()
  const [isProcessing, setIsProcessing] = useState(false)
  const [validation, setValidation] = useState({ can: false, reason: "" })

  const player = playerId ? getPlayerById(playerId) : null
  const originalTeam = originalTeamId ? getTeamById(originalTeamId) : null
  const currentTeam = player?.currentTeam ? getTeamById(player.currentTeam) : null

  useEffect(() => {
    if (playerId && originalTeamId) {
      setValidation(canUseRTM(playerId, originalTeamId))
    }
  }, [playerId, originalTeamId])

  const handleUseRTM = async () => {
    if (!playerId || !originalTeamId) return

    setIsProcessing(true)
    const success = await executeRTM(playerId, originalTeamId)
    setIsProcessing(false)

    if (await success) {
      onClose()
    }
  }

  const handleSkip = () => {
    onClose()
  }

  if (!player || !originalTeam || !currentTeam) return null

  return (
    <Dialog open={!!playerId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Right To Match Available
          </DialogTitle>
          <DialogDescription>
            {originalTeam.franchiseName || originalTeam.groupName} can match the price to get {player.name} back
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border bg-accent/5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Player</div>
                <div className="font-semibold">{player.name}</div>
                <Badge variant="outline" className="mt-1">
                  {player.role}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Purchase Price</div>
                <div className="text-2xl font-bold text-primary">₹{player.purchasePrice?.toFixed(2)} Cr</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Bought By</div>
              <div className="font-medium">{currentTeam.franchiseName || currentTeam.groupName}</div>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground mb-1">Original Team</div>
              <div className="font-medium">{originalTeam.franchiseName || originalTeam.groupName}</div>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-card">
            <div className="text-xs text-muted-foreground mb-1">Team Budget After RTM</div>
            <div className="text-lg font-bold">
              ₹{(originalTeam.remainingBudget - (player.purchasePrice || 0)).toFixed(2)} Cr
            </div>
          </div>

          {!validation.can && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validation.reason}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip} disabled={isProcessing}>
            Skip RTM
          </Button>
          <Button onClick={handleUseRTM} disabled={!validation.can || isProcessing}>
            <Shield className="h-4 w-4 mr-2" />
            Use RTM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

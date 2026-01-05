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
import { AlertCircle, Users, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StartingXISelectorProps {
  teamId: string
  open: boolean
  onClose: () => void
}

export function StartingXISelector({ teamId, open, onClose }: StartingXISelectorProps) {
  const { getTeamById, getTeamPlayers, submitStartingXI } = useAuction()
  const { toast } = useToast()
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const team = teamId ? getTeamById(teamId) : null
  const squadPlayers = getTeamPlayers(teamId)

  useEffect(() => {
    if (open && team) {
      // Pre-populate with existing starting XI if available
      setSelectedPlayers(team.startingXI || [])
    }
  }, [open, team])

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      } else {
        if (prev.length >= 11) {
          toast({
            title: "Maximum Reached",
            description: "You can only select 11 players",
            variant: "destructive"
          })
          return prev
        }
        return [...prev, playerId]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedPlayers.length !== 11) {
      toast({
        title: "Invalid Selection",
        description: "Please select exactly 11 players",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    const success = await submitStartingXI(teamId, selectedPlayers)
    setIsSubmitting(false)

    if (success) {
      onClose()
    }
  }

  if (!team) return null

  const isComplete = selectedPlayers.length === 11
  const alreadySubmitted = team.startingXI && team.startingXI.length === 11

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-150 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Select Starting XI
          </DialogTitle>
          <DialogDescription>
            Choose your top 11 players from {team.franchiseName || team.groupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-accent/5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Selected: {selectedPlayers.length} / 11</span>
            </div>
            {isComplete && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </div>

          {alreadySubmitted && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Starting XI already submitted. You can modify your selection below.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {squadPlayers.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No players in squad yet. Complete the auction first.
                </AlertDescription>
              </Alert>
            ) : (
              squadPlayers.map((player) => {
                const isSelected = selectedPlayers.includes(player.id)
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/10 border-primary" : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleTogglePlayer(player.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {player.role}
                        </Badge>
                        <Badge variant={player.country === "India" ? "default" : "secondary"} className="text-xs">
                          {player.country}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      ₹{player.purchasePrice} Cr
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {!isComplete && selectedPlayers.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select {11 - selectedPlayers.length} more player{11 - selectedPlayers.length !== 1 ? 's' : ''}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Starting XI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useAuction } from "@/lib/auction-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"

export function SettingsDialog() {
  const { settings, updateSettings } = useAuction()
  const [open, setOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    updateSettings(localSettings)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Auction Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Auction Settings</DialogTitle>
          <DialogDescription>Configure global auction parameters. Changes will apply immediately.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="totalTeams">Total Teams</Label>
            <Input
              id="totalTeams"
              type="number"
              value={localSettings.totalTeams}
              onChange={(e) => setLocalSettings({ ...localSettings, totalTeams: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budgetPerTeam">Budget per Team (Cr)</Label>
            <Input
              id="budgetPerTeam"
              type="number"
              step="0.1"
              value={localSettings.budgetPerTeam}
              onChange={(e) => setLocalSettings({ ...localSettings, budgetPerTeam: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxPlayers">Maximum Players per Team</Label>
            <Input
              id="maxPlayers"
              type="number"
              value={localSettings.maxPlayersPerTeam}
              onChange={(e) => setLocalSettings({ ...localSettings, maxPlayersPerTeam: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxOverseas">Maximum Overseas Players</Label>
            <Input
              id="maxOverseas"
              type="number"
              value={localSettings.maxOverseasPlayers}
              onChange={(e) => setLocalSettings({ ...localSettings, maxOverseasPlayers: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minBid">Minimum Bid Increment (Cr)</Label>
            <Input
              id="minBid"
              type="number"
              step="0.1"
              value={localSettings.minBidIncrement}
              onChange={(e) => setLocalSettings({ ...localSettings, minBidIncrement: Number(e.target.value) })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useAuction } from "@/lib/auction-context"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { settings, updateSettings, resetAuction } = useAuction()
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    updateSettings(localSettings)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Auction Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global auction parameters</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>These settings affect all calculations across the auction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="totalTeams">Total Number of Teams</Label>
                <Input
                  id="totalTeams"
                  type="number"
                  value={localSettings.totalTeams}
                  onChange={(e) => setLocalSettings({ ...localSettings, totalTeams: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Number of teams participating in the auction</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="budgetPerTeam">Budget per Team (Crores)</Label>
                <Input
                  id="budgetPerTeam"
                  type="number"
                  step="0.1"
                  value={localSettings.budgetPerTeam}
                  onChange={(e) => setLocalSettings({ ...localSettings, budgetPerTeam: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Total budget allocated to each team</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxPlayers">Maximum Players per Team</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  value={localSettings.maxPlayersPerTeam}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxPlayersPerTeam: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Maximum squad size for each team</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxOverseas">Maximum Overseas Players</Label>
                <Input
                  id="maxOverseas"
                  type="number"
                  value={localSettings.maxOverseasPlayers}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxOverseasPlayers: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Maximum number of overseas players per team</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minBid">Minimum Bid Increment (Crores)</Label>
                <Input
                  id="minBid"
                  type="number"
                  step="0.1"
                  value={localSettings.minBidIncrement}
                  onChange={(e) => setLocalSettings({ ...localSettings, minBidIncrement: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Minimum increment for each bid increase</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} className="w-full sm:w-auto">
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that will reset all auction data</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset Auction
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently reset all auction data including player sales,
                      team budgets, and transactions. All teams will be reset to their initial state.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetAuction} className="bg-destructive text-destructive-foreground">
                      Yes, Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

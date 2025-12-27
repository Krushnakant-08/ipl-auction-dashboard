"use client"

import { useAuction } from "@/lib/auction-context"
import { Navigation } from "@/components/navigation"
import { DatabaseAdmin } from "@/components/database-admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, RotateCcw, Save, Bug } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
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
  const { settings, resetAuction } = useAuction()
  const { toast } = useToast()
  const [localSettings, setLocalSettings] = useState({
    initialBudget: settings.initialBudget,
    minSquadSize: settings.minSquadSize,
    maxSquadSize: settings.maxSquadSize,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isResettingBudgets, setIsResettingBudgets] = useState(false)

  const handleVerifyDatabase = async () => {
    try {
      const response = await fetch('/api/verify')
      const data = await response.json()
      console.log('=== DATABASE VERIFICATION ===')
      console.log('Status:', data.ok ? '✅ PASS' : '❌ FAIL')
      console.log('Issues:', data.issues)
      console.log('Stats:', data.stats)
      console.log('============================')
      
      if (data.ok) {
        toast({
          title: "✅ Verification Passed",
          description: `All budgets and transactions are consistent. See console for details.`,
        })
      } else {
        toast({
          title: "⚠️ Issues Found",
          description: `${data.issues.length} issue(s) detected. Check console for details.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast({
        title: "Error",
        description: "Failed to verify database",
        variant: "destructive",
      })
    }
  }

  const handleDebugDatabase = async () => {
    try {
      const response = await fetch('/api/debug')
      const data = await response.json()
      console.log('=== DATABASE DEBUG INFO ===')
      console.log('Settings Initial Budget:', data.settings.initialBudget)
      console.log('Current Phase:', data.settings.currentPhase)
      console.log('Team Count:', data.teamCount)
      console.log('Teams:', data.teams)
      console.log('=========================')
      
      toast({
        title: "Database Check",
        description: `Budget: ₹${data.settings.initialBudget} Cr, Teams: ${data.teamCount}. See console for details.`,
      })
    } catch (error) {
      console.error('Debug error:', error)
      toast({
        title: "Error",
        description: "Failed to fetch debug info",
        variant: "destructive",
      })
    }
  }

  const handleResetBudgets = async () => {
    if (!confirm(`Reset all teams to ₹${localSettings.initialBudget} Cr? This will clear franchise assignments!`)) {
      return
    }
    
    setIsResettingBudgets(true)
    try {
      // First, save the new budget to settings
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      })
      
      // Get all teams from database
      const teamsResponse = await fetch('/api/teams')
      const teams = await teamsResponse.json()
      
      // Reset each team directly in database
      await Promise.all(
        teams.map((team: any) =>
          fetch('/api/teams', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...team,
              remainingBudget: localSettings.initialBudget,
              franchiseId: null,
              franchiseName: null,
              franchiseAmount: 0,
              franchiseBid: 0,
              teamAuctionComplete: false,
            }),
          })
        )
      )
      
      toast({
        title: "Success",
        description: `All teams reset to ₹${localSettings.initialBudget} Cr. Reloading...`,
      })
      
      // Force a complete reload with cache bypass
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Reset error:', error)
      toast({
        title: "Error",
        description: "Failed to reset budgets",
        variant: "destructive",
      })
      setIsResettingBudgets(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      console.log('Saving settings:', localSettings)
      
      // Save settings
      const settingsResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      })
      
      if (!settingsResponse.ok) {
        throw new Error('Failed to save settings')
      }
      
      const savedSettings = await settingsResponse.json()
      console.log('Settings saved:', savedSettings)

      toast({
        title: "Settings Saved",
        description: `Budget set to ₹${localSettings.initialBudget} Cr. Use "Reset All Team Budgets" to apply to existing teams.`,
      })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Error",
        description: "Failed to save settings. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Auction Settings</h1>
          <p className="text-muted-foreground mt-1">View auction configuration and manage database</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auction Configuration</CardTitle>
              <CardDescription>Configure budget and squad settings before starting the auction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="initialBudget">Initial Budget per Team (Crores)</Label>
                <Input
                  id="initialBudget"
                  type="number"
                  min="50"
                  max="500"
                  step="10"
                  value={localSettings.initialBudget}
                  onChange={(e) => setLocalSettings({ ...localSettings, initialBudget: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Budget allocated to each team at the start (₹50-500 Cr)</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minSquadSize">Minimum Squad Size</Label>
                <Input
                  id="minSquadSize"
                  type="number"
                  min="7"
                  max="15"
                  value={localSettings.minSquadSize}
                  onChange={(e) => setLocalSettings({ ...localSettings, minSquadSize: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Minimum number of players required in a squad</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxSquadSize">Maximum Squad Size</Label>
                <Input
                  id="maxSquadSize"
                  type="number"
                  min="11"
                  max="25"
                  value={localSettings.maxSquadSize}
                  onChange={(e) => setLocalSettings({ ...localSettings, maxSquadSize: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Maximum number of players allowed in a squad</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={handleVerifyDatabase} 
                  variant="outline"
                  className="gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Verify Database
                </Button>
                <Button 
                  onClick={handleDebugDatabase} 
                  variant="outline"
                  className="gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Quick Check
                </Button>
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    ⚠️ To Change Budget for Existing Teams:
                  </p>
                  <ol className="text-xs text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
                    <li>Change the "Initial Budget" value above</li>
                    <li>Click "Save Settings"</li>
                    <li>Then click "Reset All Team Budgets" below</li>
                    <li>Wait for the page to refresh</li>
                  </ol>
                </div>
                
                <Button 
                  onClick={handleResetBudgets} 
                  disabled={isResettingBudgets}
                  variant="destructive"
                  className="gap-2 w-full"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isResettingBudgets ? "Resetting..." : `Reset All Team Budgets to ₹${localSettings.initialBudget} Cr`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This will reset all teams and clear franchise assignments
                </p>
              </div>
            </CardContent>
          </Card>

          <DatabaseAdmin />

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

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
import { defaultSettings } from "@/lib/mock-data"


export default function SettingsPage() {
  const { settings, resetAuction } = useAuction()
  const { toast } = useToast()
  const [localSettings, setLocalSettings] = useState({
    initialBudget: settings.initialBudget,
    minSquadSize: settings.minSquadSize,
    maxSquadSize: settings.maxSquadSize,
  })
  const [isSaving, setIsSaving] = useState(false)

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
        description: `Budget set to ₹${localSettings.initialBudget} Cr.`,
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
                  step="0.01"
                  value={localSettings.initialBudget}
                  onChange={(e) => {setLocalSettings({ ...localSettings, initialBudget: Number(e.target.value) }); defaultSettings.initialBudget = Number(e.target.value)}}
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
                  onChange={(e) => {setLocalSettings({ ...localSettings, minSquadSize: Number(e.target.value) }); defaultSettings.minSquadSize = Number(e.target.value)}}
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
                  onChange={(e) => {setLocalSettings({ ...localSettings, maxSquadSize: Number(e.target.value) }); defaultSettings.maxSquadSize = Number(e.target.value)}}
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

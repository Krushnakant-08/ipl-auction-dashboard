"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAuction } from "@/lib/auction-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Shield, Building2, Lock, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { login } = useAuth()
  const { teams } = useAuction()
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [adminPassword, setAdminPassword] = useState<string>("")
  const [franchisePassword, setFranchisePassword] = useState<string>("")
  const [error, setError] = useState<string>("")

  const completedTeams = teams.filter((t) => t.teamAuctionComplete && t.franchiseName)

  const handleAdminLogin = () => {
    setError("")
    const result = login("admin", undefined, adminPassword)
    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  const handleFranchiseLogin = () => {
    if (selectedTeamId) {
      setError("")
      const result = login("franchise", selectedTeamId, franchisePassword)
      if (!result.success && result.error) {
        setError(result.error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">IPL Auction Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">Select your login type to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Login */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Access</CardTitle>
              <CardDescription>Full auction management and controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Manage team and player auctions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>View all teams and budgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Access auction settings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Complete transaction control</span>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Admin Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && adminPassword) {
                      handleAdminLogin()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Default password: <code className="bg-muted px-1 py-0.5 rounded">admin123</code>
                </p>
              </div>

              <Button onClick={handleAdminLogin} className="w-full" size="lg" disabled={!adminPassword}>
                <Shield className="mr-2 h-4 w-4" />
                Login as Admin
              </Button>
            </CardContent>
          </Card>

          {/* Franchise Login */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Franchise Access</CardTitle>
              <CardDescription>View your team and budget details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span>View your squad and players</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span>Track your remaining budget</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span>Monitor auction progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <span>Secure team-specific view</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="franchise-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Franchise Password
                  </Label>
                  <Input
                    id="franchise-password"
                    type="password"
                    placeholder="Enter franchise password"
                    value={franchisePassword}
                    onChange={(e) => setFranchisePassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && franchisePassword && selectedTeamId) {
                        handleFranchiseLogin()
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password depends on your franchise. Contact admin for your password.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="franchise-select">Select Your Franchise</Label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger id="franchise-select">
                      <SelectValue placeholder="Choose your team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {completedTeams.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No franchises available yet
                          <br />
                          <span className="text-xs">Complete team auction first</span>
                        </div>
                      ) : (
                        completedTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">{team.franchiseName}</span>
                              <span className="text-xs text-muted-foreground">({team.groupName})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleFranchiseLogin}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  disabled={!selectedTeamId || !franchisePassword}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Login as Franchise
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This is a demo authentication system. Use the passwords shown above to login.</p>
        </div>
      </div>
    </div>
  )
}

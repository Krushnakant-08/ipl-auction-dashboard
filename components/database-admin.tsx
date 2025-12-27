"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Database, Trash2, CheckCircle2, XCircle, Lock } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function DatabaseAdmin() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [clearPassword, setClearPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleInitialize = async () => {
    if (!confirm("This will populate the database with initial mock data. Continue?")) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/init", { method: "POST" })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to initialize database: " + (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearClick = () => {
    setShowPasswordDialog(true)
    setClearPassword("")
    setPasswordError("")
  }

  const handleClearConfirm = async () => {
    if (!clearPassword) {
      setPasswordError("Password is required")
      return
    }

    setLoading(true)
    setResult(null)
    setPasswordError("")

    try {
      const res = await fetch("/api/init", { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: clearPassword })
      })
      
      const data = await res.json()
      
      if (res.status === 401) {
        setPasswordError("Incorrect password")
        setLoading(false)
        return
      }
      
      setResult(data)
      setShowPasswordDialog(false)
      setClearPassword("")
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to clear database: " + (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Database Administration</CardTitle>
          <CardDescription>Initialize or clear auction data in MongoDB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleInitialize} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Database
                </>
              )}
            </Button>

            <Button onClick={handleClearClick} disabled={loading} variant="destructive" className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Database
                </>
              )}
            </Button>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Initialize Database:</strong> Populates MongoDB with mock teams, players, and
              settings. Only works if database is empty.
            </p>
            <p>
              <strong>Clear Database:</strong> Deletes all auction data from MongoDB. Requires admin password for security.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              Clear Database - Admin Password Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              ⚠️ WARNING: This will permanently DELETE ALL auction data from the database!
              This action cannot be undone. Please enter the admin password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            <Label htmlFor="clear-password">Admin Password</Label>
            <Input
              id="clear-password"
              type="password"
              value={clearPassword}
              onChange={(e) => {
                setClearPassword(e.target.value)
                setPasswordError("")
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && clearPassword) {
                  handleClearConfirm()
                }
              }}
              placeholder="Enter admin password"
              className={passwordError ? "border-destructive" : ""}
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setClearPassword("")
                setPasswordError("")
              }}
              disabled={loading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearConfirm} 
              disabled={loading || !clearPassword}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear Database'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

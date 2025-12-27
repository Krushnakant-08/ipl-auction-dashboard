"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Trash2, CheckCircle2, XCircle } from "lucide-react"

export function DatabaseAdmin() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

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

  const handleClear = async () => {
    if (!confirm("⚠️ WARNING: This will DELETE ALL auction data! Are you sure?")) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/init", { method: "DELETE" })
      const data = await res.json()
      setResult(data)
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

          <Button onClick={handleClear} disabled={loading} variant="destructive" className="flex-1">
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
            <strong>Clear Database:</strong> Deletes all auction data from MongoDB. Use with caution!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

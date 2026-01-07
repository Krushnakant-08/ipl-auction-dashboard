"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { User, UserRole } from "./types"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (role: UserRole, teamId?: string, password?: string) => { success: boolean; error?: string }
  logout: () => void
  isAdmin: () => boolean
  isFranchise: () => boolean
  canAccessRoute: (path: string) => boolean
}

// Passwords - Now using environment variables
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123"

// Individual franchise passwords (teamId: password)
const FRANCHISE_PASSWORDS: Record<string, string> = {
  t1: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T1 || "alpha123",      // Group Alpha
  t2: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T2 || "beta123",       // Group Beta
  t3: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T3 || "gamma123",      // Group Gamma
  t4: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T4 || "delta123",      // Group Delta
  t5: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T5 || "epsilon123",    // Group Epsilon
  t6: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T6 || "zeta123",       // Group Zeta
  t7: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T7 || "eta123",        // Group Eta
  t8: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T8 || "theta123",      // Group Theta
  t9: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T9 || "iota123",       // Group Iota
  t10: process.env.NEXT_PUBLIC_FRANCHISE_PASSWORD_T10 || "kappa123",    // Group Kappa
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that franchises cannot access
const ADMIN_ONLY_ROUTES = ["/auction", "/settings", "/teams", "/players"]

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("ipl-auction-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem("ipl-auction-user")
      }
    }
    setIsLoading(false)
  }, [])

  // Check route access whenever pathname changes
  useEffect(() => {
    // Skip if still loading user or SSR
    if (typeof window === "undefined" || isLoading) return

    // Only redirect if user is actually not found and we're not on login
    if (!user && !PUBLIC_ROUTES.includes(pathname) && pathname !== "/login") {
      // Double-check localStorage before redirecting
      const storedUser = localStorage.getItem("ipl-auction-user")
      if (!storedUser) {
        router.push("/login")
      }
    } else if (user && pathname === "/login") {
      router.push("/")
    } else if (user && user.role === "franchise" && ADMIN_ONLY_ROUTES.includes(pathname)) {
      router.push("/")
    }
  }, [user, pathname, router, isLoading])

  const login = useCallback(
    (role: UserRole, teamId?: string, password?: string) => {
      // Validate admin password
      if (role === "admin") {
        if (!password) {
          return { success: false, error: "Password is required" }
        }
        if (password !== ADMIN_PASSWORD) {
          return { success: false, error: "Incorrect password" }
        }
      }

      // Validate franchise password
      if (role === "franchise") {
        if (!password) {
          return { success: false, error: "Password is required" }
        }
        if (!teamId) {
          return { success: false, error: "Team selection is required" }
        }
        
        // Check if password matches the team's specific password
        const correctPassword = FRANCHISE_PASSWORDS[teamId]
        if (!correctPassword) {
          return { success: false, error: "Invalid team selected" }
        }
        if (password !== correctPassword) {
          return { success: false, error: "Incorrect password for this franchise" }
        }
      }

      const newUser: User = {
        id: role === "admin" ? "admin-1" : `franchise-${teamId}`,
        role,
        name: role === "admin" ? "Admin" : `Franchise ${teamId}`,
        teamId: role === "franchise" ? teamId : undefined,
      }
      setUser(newUser)
      localStorage.setItem("ipl-auction-user", JSON.stringify(newUser))
      router.push("/")
      return { success: true }
    },
    [router],
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("ipl-auction-user")
    router.push("/login")
  }, [router])

  const isAdmin = useCallback(() => {
    return user?.role === "admin"
  }, [user])

  const isFranchise = useCallback(() => {
    return user?.role === "franchise"
  }, [user])

  const canAccessRoute = useCallback(
    (path: string) => {
      if (PUBLIC_ROUTES.includes(path)) return true
      if (!user) return false
      if (user.role === "admin") return true
      if (user.role === "franchise" && ADMIN_ONLY_ROUTES.includes(path)) return false
      return true
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isAdmin,
        isFranchise,
        canAccessRoute,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

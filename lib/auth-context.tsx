"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { User, UserRole } from "./types"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (role: UserRole, teamId?: string, password?: string) => { success: boolean; error?: string }
  logout: () => void
  isAdmin: () => boolean
  isFranchise: () => boolean
  canAccessRoute: (path: string) => boolean
}

// Passwords - In production, use environment variables and proper authentication
const ADMIN_PASSWORD = "admin123"
const FRANCHISE_PASSWORD = "franchise123"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that franchises cannot access
const ADMIN_ONLY_ROUTES = ["/auction", "/settings", "/teams", "/players"]

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("ipl-auction-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Check route access whenever pathname changes
  useEffect(() => {
    // Skip if still loading user
    if (typeof window === "undefined") return

    if (!user && !PUBLIC_ROUTES.includes(pathname) && pathname !== "/login") {
      router.push("/login")
    } else if (user && pathname === "/login") {
      router.push("/")
    } else if (user && user.role === "franchise" && ADMIN_ONLY_ROUTES.includes(pathname)) {
      router.push("/")
    }
  }, [user, pathname, router])

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
        if (password !== FRANCHISE_PASSWORD) {
          return { success: false, error: "Incorrect password" }
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
        login,
        logout,
        isAdmin,
        isFranchise,
        canAccessRoute,
      }}
    >
      {children}
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

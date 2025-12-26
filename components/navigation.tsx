"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, ListFilter, Gavel, Trophy, Settings, LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "franchise"] },
  { name: "Live Auction", href: "/auction", icon: Gavel, roles: ["admin"] },
  { name: "Teams", href: "/teams", icon: Users, roles: ["admin"] },
  { name: "Player Pool", href: "/players", icon: ListFilter, roles: ["admin"] },
  { name: "Squad View", href: "/squads", icon: Trophy, roles: ["admin", "franchise"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-foreground">IPL Auction</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Info and Logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user.name}</span>
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                  {user.role === "admin" ? "Admin" : "Franchise"}
                </Badge>
              </div>
              <Button onClick={logout} variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

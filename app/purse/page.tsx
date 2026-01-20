"use client"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Team } from "@/lib/types"
import { AuctionWebSocket } from "@/lib/websocket"

// Team color schemes matching IPL teams
const teamColors: Record<string, { bg: string; text: string }> = {
  'Kolkata Knight Riders': { bg: 'bg-gradient-to-br from-purple-900 to-purple-700', text: 'text-yellow-300' },
  'Chennai Super Kings': { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-300', text: 'text-blue-900' },
  'Sunrisers Hyderabad': { bg: 'bg-gradient-to-br from-orange-500 to-orange-400', text: 'text-white' },
  'Delhi Capitals': { bg: 'bg-gradient-to-br from-blue-600 to-blue-500', text: 'text-white' },
  'Rajasthan Royals': { bg: 'bg-gradient-to-br from-pink-400 to-pink-300', text: 'text-white' },
  'Royal Challengers Bangalore': { bg: 'bg-gradient-to-br from-red-600 to-red-500', text: 'text-white' },
  'Punjab Kings': { bg: 'bg-gradient-to-br from-red-500 to-red-400', text: 'text-white' },
  'Gujarat Titans': { bg: 'bg-gradient-to-br from-blue-800 to-blue-700', text: 'text-white' },
  'Mumbai Indians': { bg: 'bg-gradient-to-br from-blue-700 to-blue-600', text: 'text-white' },
  'Lucknow Super Giants': { bg: 'bg-gradient-to-br from-cyan-400 to-cyan-300', text: 'text-blue-900' },
}

const getTeamColor = (teamName: string) => {
  // Try to match team name with color scheme
  const upperName = teamName
  console.log('Determining colors for team:', teamName)
  for (const [key, colors] of Object.entries(teamColors)) {
    if (upperName.includes(key)) {
      return colors
    }
  }
  // Default colors
  return { bg: 'bg-gradient-to-br from-blue-600 to-blue-500', text: 'text-white' }
}

export default function PursePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const wsRef = useRef<AuctionWebSocket | null>(null)

  // Fetch teams and setup real-time updates
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/teams')
        const data = await response.json()
        console.log('Fetched teams data:', data)
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setTeams(data)
          console.log('Teams set:', data.length)
        } else if (data.success && data.teams) {
          setTeams(data.teams)
          console.log('Teams set:', data.teams.length)
        } else if (data.error) {
          console.error('API error:', data.error)
        } else {
          console.error('Unexpected response format:', data)
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setSettings(data[0])
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    
    // Initial fetch
    fetchTeams()
    fetchSettings()

    // Setup WebSocket for real-time updates
    if (!wsRef.current) {
      wsRef.current = new AuctionWebSocket()
      wsRef.current.connect((data) => {
        // Refresh teams data on any update
        if (data.type === 'auction_update' || data.type === 'team_update' || data.type === 'player_update') {
          fetchTeams()
        }
      })
    }

    return () => {
      wsRef.current?.disconnect()
      wsRef.current = null
    }
  }, [])

  // Sort teams by remaining budget (descending)
  const sortedTeams = [...teams].sort((a, b) => b.remainingBudget - a.remainingBudget)
  
  // Split teams into left and right columns
  const halfLength = Math.ceil(sortedTeams.length / 2)
  const leftTeams = sortedTeams.slice(0, halfLength)
  const rightTeams = sortedTeams.slice(halfLength)

  return (
    <div className="min-h-screen bg-[#0a1929] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#1e3a8a_0%,_transparent_50%)]"></div>
      </div>
      
      {/* Trophy Background Image */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15">
        <Image
          src="/pur.jpg"
          alt="IPL Trophy"
          fill
          className="object-cover"
          priority
        />
      </div>

      <main className="relative z-10 mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">
            PURSE REMAINING
          </h1>
          <p className="text-orange-500 text-lg md:text-xl font-bold tracking-wide">
            FOR EACH TEAMS (SLOTS LEFT)
          </p>
        </div>

        {loading ? (
          <div className="text-center text-white text-2xl py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto"></div>
            <p className="mt-4">Loading teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center text-white text-2xl py-20 bg-white/5 rounded-2xl border border-white/10">
            <p className="mb-2">No teams found</p>
            <p className="text-sm text-gray-400">Please initialize teams in settings</p>
          </div>
        ) : (
          <>
            {/* Teams Grid with Trophy in Center */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full px-4 items-center">
              {/* Left Column - First Half of Teams */}
              <div className="space-y-2">
                {leftTeams.map((team) => {
                  const colors = getTeamColor(team.franchiseName || team.groupName)
                  const slotsLeft = settings ? settings.maxSquadSize - team.squadPlayerIds.length : 0
                  
                  return (
                    <div
                      key={team.id}
                      className={`${colors.bg} rounded-lg p-4 shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                          <div className="relative h-full w-full rounded-full overflow-hidden bg-white/90 p-2">
                            <Image
                              src={team.logo || "/placeholder.svg"}
                              alt={team.franchiseName || team.groupName}
                              fill
                              className="object-cover p-1"
                              sizes="80px"
                            />
                          </div>
                        </div>

                        {/* Purse Info */}
                        <div className={`flex-1 text-right ${colors.text}`}>
                          <div className="text-3xl md:text-4xl font-black leading-none mb-1">
                            {team.remainingBudget.toFixed(1)} Cr
                          </div>
                          <div className={`text-xs md:text-sm font-bold opacity-90`}>
                            Slots left: {slotsLeft}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Center Column - Trophy */}
              <div className="flex items-center justify-center">
                <div className="relative w-full h-[500px]">
                  <Image
                    src="/trophy.png"
                    alt="IPL Trophy"
                    fill
                    className="object-cover drop-shadow-2xl"
                    sizes="350px"
                  />
                </div>
              </div>

              {/* Right Column - Second Half of Teams */}
              <div className="space-y-2">
                {rightTeams.map((team) => {
                  const colors = getTeamColor(team.franchiseName || team.groupName)
                  const slotsLeft = settings ? settings.maxSquadSize - team.squadPlayerIds.length : 0
                  
                  return (
                    <div
                      key={team.id}
                      className={`${colors.bg} rounded-lg p-4 shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-white/20`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                          <div className="relative h-full w-full rounded-full overflow-hidden bg-white/90 p-2">
                            <Image
                              src={team.logo || "/placeholder.svg"}
                              alt={team.franchiseName || team.groupName}
                              fill
                              className="object-cover p-1"
                              sizes="80px"
                            />
                          </div>
                        </div>

                        {/* Purse Info */}
                        <div className={`flex-1 text-right ${colors.text}`}>
                          <div className="text-3xl md:text-4xl font-black leading-none mb-1">
                            {team.remainingBudget.toFixed(1)} Cr
                          </div>
                          <div className={`text-xs md:text-sm font-bold opacity-90`}>
                            Slots left: {slotsLeft}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-4 text-center">
              <div className="inline-flex flex-wrap gap-4 bg-white/10 backdrop-blur-lg rounded-xl px-6 py-3 border border-white/20">
                <div className="text-white text-sm">
                  <span className="font-bold text-orange-500">Total Teams:</span>{" "}
                  <span className="text-lg font-bold">{teams.length}</span>
                </div>
                <div className="text-white text-sm">
                  <span className="font-bold text-orange-500">Average Purse:</span>{" "}
                  <span className="text-lg font-bold">
                    ₹{teams.length > 0 ? (teams.reduce((sum, t) => sum + t.remainingBudget, 0) / teams.length).toFixed(1) : '0'} Cr
                  </span>
                </div>
                <div className="text-white text-sm">
                  <span className="font-bold text-orange-500">Highest:</span>{" "}
                  <span className="text-lg font-bold">
                    ₹{sortedTeams.length > 0 ? sortedTeams[0].remainingBudget.toFixed(1) : '0'} Cr
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

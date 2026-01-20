"use client"

import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { Team } from "@/lib/types"

export default function PursePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch teams without authentication
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams')
        const data = await response.json()
        if (data.success) {
          setTeams(data.teams)
        }
      } catch (error) {
        console.error('Error fetching teams:', error)
      }
    }
    fetchTeams()
  }, [])

  // Sort teams by remaining budget (descending)
  const sortedTeams = [...teams].sort((a, b) => b.remainingBudget - a.remainingBudget)
  
  // Split teams into left and right columns
  const leftTeams = sortedTeams.slice(0, 5)
  const rightTeams = sortedTeams.slice(5, 10)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let rotation = 0

    const drawTrophy = () => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      // Center point
      const centerX = width / 2
      const centerY = height / 2
      
      // Apply rotation
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation)
      ctx.translate(-centerX, -centerY)
      
      // Create gradient for trophy
      const gradient = ctx.createLinearGradient(centerX - 100, 0, centerX + 100, height)
      gradient.addColorStop(0, "#FFD700")
      gradient.addColorStop(0.5, "#FFA500")
      gradient.addColorStop(1, "#FF8C00")
      
      // Draw trophy body (cup shape)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.moveTo(centerX - 80, centerY - 100)
      ctx.quadraticCurveTo(centerX - 100, centerY - 50, centerX - 60, centerY + 20)
      ctx.lineTo(centerX - 40, centerY + 60)
      ctx.lineTo(centerX + 40, centerY + 60)
      ctx.lineTo(centerX + 60, centerY + 20)
      ctx.quadraticCurveTo(centerX + 100, centerY - 50, centerX + 80, centerY - 100)
      ctx.closePath()
      ctx.fill()
      
      // Draw trophy handles
      ctx.strokeStyle = "#FFD700"
      ctx.lineWidth = 12
      ctx.beginPath()
      ctx.arc(centerX - 90, centerY - 30, 30, 0.5, Math.PI - 0.5, false)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.arc(centerX + 90, centerY - 30, 30, Math.PI + 0.5, 2 * Math.PI - 0.5, false)
      ctx.stroke()
      
      // Draw base
      ctx.fillStyle = gradient
      ctx.fillRect(centerX - 50, centerY + 60, 100, 15)
      ctx.fillRect(centerX - 60, centerY + 75, 120, 10)
      ctx.fillRect(centerX - 70, centerY + 85, 140, 15)
      
      // Add shine effect
      const shineGradient = ctx.createLinearGradient(centerX - 60, centerY - 80, centerX - 40, centerY - 40)
      shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
      shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = shineGradient
      ctx.beginPath()
      ctx.ellipse(centerX - 40, centerY - 50, 20, 40, 0.3, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.restore()
      
      // Add IPL text
      ctx.fillStyle = "#1e40af"
      ctx.font = "bold 32px Arial"
      ctx.textAlign = "center"
      ctx.fillText("IPL", centerX, centerY + 130)
      ctx.font = "bold 18px Arial"
      ctx.fillText("TROPHY", centerX, centerY + 155)
      
      rotation += 0.01
      animationFrameId = requestAnimationFrame(drawTrophy)
    }

    drawTrophy()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-900">
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Team Purse Status</h1>
          <p className="text-blue-200 text-xl">Remaining Budget Overview</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - 5 Teams */}
          <div className="space-y-4">
            {leftTeams.map((team, index) => (
              <Card
                key={team.id}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-white/20 hover:scale-105 transition-transform duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/30">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.franchiseName || team.groupName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {team.franchiseName || team.groupName}
                        </h3>
                        {team.franchiseName && (
                          <p className="text-sm text-blue-200">{team.groupName}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-yellow-400">
                        ₹{team.remainingBudget.toFixed(1)}
                      </div>
                      <div className="text-sm text-blue-200">Cr Remaining</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Center - 3D Trophy */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={500}
                className="drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 to-transparent blur-3xl -z-10" />
            </div>
          </div>

          {/* Right Column - 5 Teams */}
          <div className="space-y-4">
            {rightTeams.map((team, index) => (
              <Card
                key={team.id}
                className="bg-gradient-to-bl from-white/10 to-white/5 backdrop-blur-lg border-white/20 hover:scale-105 transition-transform duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-3xl font-bold text-yellow-400">
                        ₹{team.remainingBudget.toFixed(1)}
                      </div>
                      <div className="text-sm text-blue-200">Cr Remaining</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <h3 className="text-xl font-bold text-white">
                          {team.franchiseName || team.groupName}
                        </h3>
                        {team.franchiseName && (
                          <p className="text-sm text-blue-200">{team.groupName}</p>
                        )}
                      </div>
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/30">
                        <Image
                          src={team.logo || "/placeholder.svg"}
                          alt={team.franchiseName || team.groupName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-lg rounded-lg px-8 py-4 border border-white/20">
            <p className="text-white text-sm">
              <span className="font-bold">Total Teams:</span> {teams.length} | 
              <span className="font-bold ml-4">Average Purse:</span> ₹
              {(teams.reduce((sum, t) => sum + t.remainingBudget, 0) / teams.length).toFixed(1)} Cr
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

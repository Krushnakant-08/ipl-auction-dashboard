import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Settings from '@/lib/models/Settings'
import { defaultSettings } from '@/lib/mock-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    let settings = await Settings.findOne({})
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        initialBudget: defaultSettings.initialBudget,
        minSquadSize: defaultSettings.minSquadSize,
        maxSquadSize: defaultSettings.maxSquadSize,
        currentPhase: defaultSettings.currentPhase,
        tradingWindowEnd: null,
      })
    }
    
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()

    // Get current settings to check if initialBudget changed
    const currentSettings = await Settings.findOne({})
    const newInitialBudget = body.initialBudget

    const settings = await Settings.findOneAndUpdate({}, body, { new: true, upsert: true })

    // If initialBudget changed, update all teams' remainingBudget
    if (currentSettings && newInitialBudget !== currentSettings.initialBudget) {
      console.log(`🔄 Updating team budgets from ${currentSettings.initialBudget} to ${newInitialBudget} Cr`)

      // Import models here to avoid circular imports
      const Team = (await import('@/lib/models/Team')).default
      const Player = (await import('@/lib/models/Player')).default

      // Get all teams and recalculate their remaining budgets
      const teams = await Team.find({})
      for (const team of teams) {
        // Calculate total spent: franchise bid + sum of player purchase prices
        let totalSpent = team.franchiseBid || 0

        if (team.squadPlayerIds && team.squadPlayerIds.length > 0) {
          const players = await Player.find({ id: { $in: team.squadPlayerIds } })
          totalSpent += players.reduce((sum, player) => sum + (player.purchasePrice || 0), 0)
        }

        team.remainingBudget = newInitialBudget - totalSpent
        await team.save()
      }

      console.log(`✅ Updated ${teams.length} teams' remaining budgets`)
    }

    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

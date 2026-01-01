import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Player from '@/lib/models/Player'
import Settings from '@/lib/models/Settings'
import Transaction from '@/lib/models/Transaction'
import Trade from '@/lib/models/Trade'
import { mockTeams, mockPlayers, defaultSettings } from '@/lib/mock-data'
import { log } from 'console'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Initialize database with mock data
 * This endpoint should only be used for initial setup or testing
 * Call it once to populate your MongoDB with initial data
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    console.log('🌱 Initializing database with mock data...')
    
    // Check if data already exists
    const existingTeamsCount = await Team.countDocuments()
    const existingPlayersCount = await Player.countDocuments()
    
    if (existingTeamsCount > 0 || existingPlayersCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Database already has data. Use DELETE to clear first.',
        existingTeams: existingTeamsCount,
        existingPlayers: existingPlayersCount,
      })
    }
    
    // Get or create settings
    let currentSettings = await Settings.findOne({})
    if (!currentSettings) {
      currentSettings = await Settings.create(defaultSettings)
    }
    
    // Update mock teams with the current initial budget
    const teamsWithBudget = mockTeams.map(team => ({
      ...team,
      remainingBudget: currentSettings.initialBudget
    }))
    
    // Insert data
    await Promise.all([
      Team.insertMany(teamsWithBudget),
      Player.insertMany(mockPlayers),
    ])
    
    console.log('✅ Database initialized with mock data')
    console.log('💰 Initial budget per team:', currentSettings.initialBudget, 'Cr')
    console.log('players created:', mockPlayers)
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      teamsCreated: mockTeams.length,
      playersCreated: mockPlayers.length,
      initialBudget: currentSettings.initialBudget,
    })
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database', details: error },
      { status: 500 }
    )
  }
}

/**
 * Clear all data from database
 * WARNING: This will delete all auction data!
 * Requires admin password for security
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check for admin password
    const CLEAR_DB_PASSWORD = process.env.CLEAR_DB_PASSWORD || 'cleardb123'
    
    const body = await request.json()
    const { password } = body
    
    if (!password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Password is required to clear database' 
        },
        { status: 401 }
      )
    }
    
    if (password !== CLEAR_DB_PASSWORD) {
      console.warn('⚠️ Failed attempt to clear database with incorrect password')
      return NextResponse.json(
        { 
          success: false,
          error: 'Incorrect password' 
        },
        { status: 401 }
      )
    }
    
    await connectDB()
    
    await Promise.all([
      Team.deleteMany({}),
      Player.deleteMany({}),
      Settings.deleteMany({}),
      Transaction.deleteMany({}),
      Trade.deleteMany({}),
    ])
    
    console.log('✅ Database cleared successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
    })
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear database' 
      },
      { status: 500 }
    )
  }
}

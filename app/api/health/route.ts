import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Player from '@/lib/models/Player'
import Settings from '@/lib/models/Settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Health check endpoint to verify database connection and data status
 * Use this to diagnose deployment issues
 */
export async function GET() {
  try {
    // Check MongoDB connection
    await connectDB()
    
    // Check collections
    const [teamsCount, playersCount, settingsCount] = await Promise.all([
      Team.countDocuments(),
      Player.countDocuments(),
      Settings.countDocuments(),
    ])
    
    const isInitialized = teamsCount > 0 && playersCount > 0
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        initialized: isInitialized,
        collections: {
          teams: teamsCount,
          players: playersCount,
          settings: settingsCount,
        }
      },
      message: isInitialized 
        ? 'Database is healthy and initialized' 
        : '⚠️ Database connected but not initialized. Call POST /api/init to initialize.',
    })
  } catch (error) {
    console.error('❌ Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      },
      message: 'Database connection failed',
    }, { status: 500 })
  }
}

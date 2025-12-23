import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Player from '@/lib/models/Player'
import Settings from '@/lib/models/Settings'
import { getConnectionStatus, checkDBHealth } from '@/lib/db-utils'

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
    
    // Get connection details
    const connectionStatus = getConnectionStatus()
    const isHealthy = await checkDBHealth()
    
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
        ...connectionStatus,
        healthy: isHealthy,
        initialized: isInitialized,
        collections: {
          teams: teamsCount,
          players: playersCount,
          settings: settingsCount,
        }
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      uptime: Math.round(process.uptime()),
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

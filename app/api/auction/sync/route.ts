import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Settings from '@/lib/models/Settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Lightweight endpoint to check if auction data has changed
 * Returns only lastUpdate timestamp to minimize database queries
 */
export async function GET() {
  try {
    await connectDB()
    
    // Only query settings for the lastUpdate timestamp
    const settings = await Settings.findOne({}).select('updatedAt').lean()
    
    return NextResponse.json({
      lastUpdate: settings?.updatedAt ? new Date(settings.updatedAt).getTime() : Date.now(),
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('❌ Error checking auction sync:', error)
    return NextResponse.json(
      { lastUpdate: Date.now() },
      { status: 200 } // Return 200 even on error to prevent reconnection loops
    )
  }
}

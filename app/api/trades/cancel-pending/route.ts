import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/lib/models/Trade'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cancel all pending trades
 * Called when trading window expires
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Update all pending trades to Cancelled status
    const result = await Trade.updateMany(
      { status: 'Pending' },
      { 
        status: 'Cancelled',
        respondedAt: new Date(),
        message: 'Automatically cancelled due to trading window expiration'
      }
    )
    
    console.log(`✅ Cancelled ${result.modifiedCount} pending trades`)
    
    return NextResponse.json({ 
      message: 'Pending trades cancelled successfully',
      count: result.modifiedCount 
    })
  } catch (error) {
    console.error('Error cancelling pending trades:', error)
    return NextResponse.json({ error: 'Failed to cancel pending trades' }, { status: 500 })
  }
}

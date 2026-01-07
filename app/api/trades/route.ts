import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/lib/models/Trade'
import Settings from '@/lib/models/Settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    const trades = await Trade.find({}).sort({ proposedAt: -1 })
    return NextResponse.json(trades)
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Check if trading window is active
    const settings = await Settings.findOne({})
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 400 })
    }
    
    // Check if current phase is Trading Window
    if (settings.currentPhase !== 'Trading Window') {
      return NextResponse.json({ 
        error: 'Trading window is not active. Trades can only be proposed during the Trading Window phase.' 
      }, { status: 403 })
    }
    
    // Check if trading window has expired
    if (settings.tradingWindowEnd) {
      const now = new Date()
      const windowEnd = new Date(settings.tradingWindowEnd)
      
      if (now > windowEnd) {
        return NextResponse.json({ 
          error: 'Trading window has expired. No new trades can be proposed.' 
        }, { status: 403 })
      }
    }
    
    const body = await request.json()
    const trade = await Trade.create(body)
    return NextResponse.json(trade)
  } catch (error) {
    console.error('Error creating trade:', error)
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { id, ...updateData } = body
    const trade = await Trade.findOneAndUpdate({ id }, updateData, { new: true })
    return NextResponse.json(trade)
  } catch (error) {
    console.error('Error updating trade:', error)
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 })
  }
}

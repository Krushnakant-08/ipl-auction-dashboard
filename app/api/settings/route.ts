import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Settings from '@/lib/models/Settings'

export async function GET() {
  try {
    await connectDB()
    let settings = await Settings.findOne({})
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        initialBudget: 100,
        minSquadSize: 7,
        maxSquadSize: 11,
        currentPhase: 'Team Auction',
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
    const settings = await Settings.findOneAndUpdate({}, body, { new: true, upsert: true })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

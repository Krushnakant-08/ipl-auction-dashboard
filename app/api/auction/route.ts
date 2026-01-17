import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Player from '@/lib/models/Player'
import Settings from '@/lib/models/Settings'
import Transaction from '@/lib/models/Transaction'
import Trade from '@/lib/models/Trade'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cache to reduce database queries
let cachedData: any = null
let lastCacheTime = 0
const CACHE_DURATION = 200 // 200ms cache to ensure fresh data when switching tabs

export async function GET() {
  try {
    // Return cached data if still fresh
    const now = Date.now()
    if (cachedData && (now - lastCacheTime) < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'X-Cache': 'HIT',
        },
      })
    }
    
    await connectDB()
    
    // Use lean() for better performance - returns plain objects instead of Mongoose documents
    const [teams, players, settings, transactions, trades] = await Promise.all([
      Team.find({}).lean(),
      Player.find({}).lean(),
      Settings.findOne({}).lean(),
      Transaction.find({}).sort({ timestamp: -1 }).limit(100).lean(),
      Trade.find({}).sort({ proposedAt: -1 }).limit(50).lean(),
    ])

    // Update cache
    cachedData = {
      settings: settings || null,
      teams: teams || [],
      players: players || [],
      transactions: transactions || [],
      trades: trades || [],
      lastUpdate: Date.now(),
    }
    lastCacheTime = now
    
    return NextResponse.json(cachedData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('❌ Error fetching auction data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auction data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const data = await request.json()
    
    // Update settings
    if (data.settings) {
      await Settings.findOneAndUpdate({}, data.settings, { upsert: true, new: true })
    }
    
    // Update teams
    if (data.teams && Array.isArray(data.teams)) {
      await Promise.all(
        data.teams.map((team: any) =>
          Team.findOneAndUpdate({ id: team.id }, team, { upsert: true, new: true })
        )
      )
    }
    
    // Update players
    if (data.players && Array.isArray(data.players)) {
      await Promise.all(
        data.players.map((player: any) =>
          Player.findOneAndUpdate({ id: player.id }, player, { upsert: true, new: true })
        )
      )
    }
    
    // Update transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      await Promise.all(
        data.transactions.map((transaction: any) =>
          Transaction.findOneAndUpdate({ id: transaction.id }, transaction, { upsert: true, new: true })
        )
      )
    }
    
    // Update trades
    if (data.trades && Array.isArray(data.trades)) {
      await Promise.all(
        data.trades.map((trade: any) =>
          Trade.findOneAndUpdate({ id: trade.id }, trade, { upsert: true, new: true })
        )
      )
    }
    
    // Invalidate cache when data is updated
    cachedData = null
    lastCacheTime = 0
    
    // Only log significant changes
    if (data.settings?.currentPhase) {
      console.log('✅ Auction phase updated:', data.settings.currentPhase)
    }
    
    return NextResponse.json({ success: true, lastUpdate: Date.now() })
  } catch (error) {
    console.error('❌ Error saving auction data:', error)
    return NextResponse.json(
      { error: 'Failed to save auction data' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await connectDB()
    
    await Promise.all([
      Team.deleteMany({}),
      Player.deleteMany({}),
      Settings.deleteMany({}),
      Transaction.deleteMany({}),
      Trade.deleteMany({}),
    ])
    
    console.log('✅ Auction state cleared from database')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error clearing auction data:', error)
    return NextResponse.json(
      { error: 'Failed to clear auction data' },
      { status: 500 }
    )
  }
}

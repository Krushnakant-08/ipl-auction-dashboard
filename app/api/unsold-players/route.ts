import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UnsoldPlayer from '@/lib/models/UnsoldPlayer'
import Player from '@/lib/models/Player'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    
    // Get unsold players sorted by insertion order
    const unsoldPlayers = await UnsoldPlayer.find({}).sort({ insertOrder: 1 }).lean()
    
    return NextResponse.json(unsoldPlayers, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching unsold players:', error)
    return NextResponse.json({ error: 'Failed to fetch unsold players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    if (body.action === 'create-list') {
      // Get all unsold players from the main player collection
      const unsoldPlayersFromDB = await Player.find({ status: 'Unsold' }).lean()
      
      if (unsoldPlayersFromDB.length === 0) {
        return NextResponse.json({ 
          message: 'No unsold players found',
          count: 0 
        })
      }
      
      // Clear existing unsold player list
      await UnsoldPlayer.deleteMany({})
      
      // Create unsold player records with insertion order
      const unsoldPlayerRecords = unsoldPlayersFromDB.map((player, index) => ({
        id: `unsold-${player.id}-${Date.now()}`,
        playerId: player.id,
        playerName: player.name,
        role: player.role,
        country: player.country,
        basePrice: player.basePrice,
        originalTeam: player.originalTeam,
        auctionRound: 1,
        insertOrder: index + 1,
        timestamp: new Date(),
      }))
      
      await UnsoldPlayer.insertMany(unsoldPlayerRecords)
      
      console.log(`✅ Created unsold player list with ${unsoldPlayerRecords.length} players`)
      
      return NextResponse.json({ 
        message: 'Unsold player list created successfully',
        count: unsoldPlayerRecords.length,
        players: unsoldPlayerRecords
      })
    }
    
    if (body.action === 'add') {
      // Add a single player to unsold list
      const player = await Player.findOne({ id: body.playerId }).lean()
      
      if (!player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 })
      }
      
      // Get the next insertion order
      const lastUnsold = await UnsoldPlayer.findOne().sort({ insertOrder: -1 })
      const nextOrder = lastUnsold ? lastUnsold.insertOrder + 1 : 1
      
      const unsoldPlayer = await UnsoldPlayer.create({
        id: `unsold-${player.id}-${Date.now()}`,
        playerId: player.id,
        playerName: player.name,
        role: player.role,
        country: player.country,
        basePrice: player.basePrice,
        originalTeam: player.originalTeam,
        insertOrder: nextOrder,
      })
      
      return NextResponse.json(unsoldPlayer)
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing unsold players:', error)
    return NextResponse.json({ error: 'Failed to manage unsold players' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    if (body.action === 'clear-all') {
      await UnsoldPlayer.deleteMany({})
      return NextResponse.json({ message: 'All unsold players cleared' })
    }
    
    if (body.playerId) {
      await UnsoldPlayer.deleteOne({ playerId: body.playerId })
      return NextResponse.json({ message: 'Player removed from unsold list' })
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting unsold players:', error)
    return NextResponse.json({ error: 'Failed to delete unsold players' }, { status: 500 })
  }
}

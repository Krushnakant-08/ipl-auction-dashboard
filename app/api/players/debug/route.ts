import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Player from '@/lib/models/Player'

export async function GET() {
  try {
    await connectDB()
    
    // Get all players
    const allPlayers = await Player.find({})
    
    // Get sold players
    const soldPlayers = allPlayers.filter(p => p.status === 'Sold')
    
    // Get unsold players  
    const unsoldPlayers = allPlayers.filter(p => p.status === 'Unsold')
    
    return NextResponse.json({
      success: true,
      totalPlayers: allPlayers.length,
      soldCount: soldPlayers.length,
      unsoldCount: unsoldPlayers.length,
      soldPlayers: soldPlayers.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        currentTeam: p.currentTeam,
        originalTeam: p.originalTeam,
        purchasePrice: p.purchasePrice,
      })),
      sampleUnsoldPlayer: unsoldPlayers[0] ? {
        id: unsoldPlayers[0].id,
        name: unsoldPlayers[0].name,
        status: unsoldPlayers[0].status,
        currentTeam: unsoldPlayers[0].currentTeam,
        purchasePrice: unsoldPlayers[0].purchasePrice,
      } : null
    })
  } catch (error: any) {
    console.error('❌ Error checking players:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

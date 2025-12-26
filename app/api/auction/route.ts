import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for auction state (shared across all clients)
let auctionState = {
  settings: null,
  teams: null,
  players: null,
  transactions: null,
  lastUpdate: Date.now(),
}

export async function GET() {
  // Removed console.log to reduce noise
  return NextResponse.json(auctionState)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  
  auctionState = {
    ...data,
    lastUpdate: Date.now(),
  }
  
  // Only log significant changes
  if (data.settings?.currentPhase) {
    console.log('Auction phase:', data.settings.currentPhase)
  }
  
  return NextResponse.json({ success: true, lastUpdate: auctionState.lastUpdate })
}

export async function DELETE() {
  auctionState = {
    settings: null,
    teams: null,
    players: null,
    transactions: null,
    lastUpdate: Date.now(),
  }
  
  console.log('Auction state cleared')
  return NextResponse.json({ success: true })
}

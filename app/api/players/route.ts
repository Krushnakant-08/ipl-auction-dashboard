import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Player from '@/lib/models/Player'

export async function GET() {
  try {
    await connectDB()
    const players = await Player.find({})
    return NextResponse.json(players, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const player = await Player.create(body)
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { id, ...updateData } = body
    const player = await Player.findOneAndUpdate({ id }, updateData, { new: true, upsert: true })
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}

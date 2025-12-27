import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'

export async function GET() {
  try {
    await connectDB()
    const teams = await Team.find({})
    return NextResponse.json(teams, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const team = await Team.create(body)
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { id, ...updateData } = body
    const team = await Team.findOneAndUpdate({ id }, updateData, { new: true, upsert: true })
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Trade from '@/lib/models/Trade'

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

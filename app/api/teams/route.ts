import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await connectDB()
    console.log('🔍 Fetching teams from database...')
    
    const teams = await Team.find({}).lean()
    console.log(`✅ Found ${teams.length} teams in database`)
    
    if (teams.length === 0) {
      console.warn('⚠️ No teams found in database. Database may not be initialized.')
      console.warn('💡 Call POST /api/init to initialize the database with mock data')
    }
    
    return NextResponse.json(teams, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('❌ Error fetching teams:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to fetch teams', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    
    console.log('📝 Creating new team:', body.id)
    
    if (!body.id || !body.groupName) {
      return NextResponse.json({ 
        error: 'Missing required fields: id and groupName are required' 
      }, { status: 400 })
    }
    
    const team = await Team.create(body)
    const createdTeam = Array.isArray(team) ? team[0] : team
    console.log('✅ Team created successfully:', createdTeam.id)
    
    return NextResponse.json(createdTeam)
  } catch (error) {
    console.error('❌ Error creating team:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to create team',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { id, ...updateData } = body
    
    console.log('🔄 Updating team:', id)
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id is required for update' 
      }, { status: 400 })
    }
    
    const team = await Team.findOneAndUpdate(
      { id }, 
      updateData, 
      { new: true, upsert: true, runValidators: true }
    )
    
    console.log('✅ Team updated successfully:', team?.id)
    
    return NextResponse.json(team)
  } catch (error) {
    console.error('❌ Error updating team:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to update team',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

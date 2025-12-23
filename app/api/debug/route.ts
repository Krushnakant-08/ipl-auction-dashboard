import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Settings from '@/lib/models/Settings'

/**
 * Debug endpoint to check database state
 */
export async function GET() {
  try {
    await connectDB()
    
    const settings = await Settings.findOne({})
    const teams = await Team.find({})
    
    return NextResponse.json({
      settings: {
        initialBudget: settings?.initialBudget || 'NOT FOUND',
        currentPhase: settings?.currentPhase || 'NOT FOUND',
      },
      teamCount: teams.length,
      teams: teams.map(t => ({
        id: t.id,
        groupName: t.groupName,
        remainingBudget: t.remainingBudget,
        franchiseName: t.franchiseName,
      })),
      raw: {
        settings,
        firstTeam: teams[0],
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

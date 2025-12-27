import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Player from '@/lib/models/Player'
import Settings from '@/lib/models/Settings'
import Transaction from '@/lib/models/Transaction'

/**
 * Verification endpoint to check database consistency
 * Verifies budget calculations, player assignments, and transaction totals
 */
export async function GET() {
  try {
    await connectDB()
    
    const [teams, players, settings, transactions] = await Promise.all([
      Team.find({}),
      Player.find({}),
      Settings.findOne({}),
      Transaction.find({}),
    ])

    const issues: string[] = []
    const stats: any = {}

    // Verify settings exist
    if (!settings) {
      issues.push('Settings not found in database')
      return NextResponse.json({ ok: false, issues, stats: null })
    }

    stats.initialBudget = settings.initialBudget
    stats.totalTeams = teams.length

    // Verify each team's budget
    const teamVerifications = teams.map(team => {
      const teamPlayers = players.filter(p => p.currentTeam === team.id)
      const playersCost = teamPlayers.reduce((sum, p) => sum + (p.purchasePrice || 0), 0)
      const totalSpent = team.franchiseBid + playersCost
      const calculatedRemaining = settings.initialBudget - totalSpent
      
      const verification = {
        teamId: team.id,
        teamName: team.franchiseName || team.groupName,
        franchiseBid: team.franchiseBid,
        playersCount: teamPlayers.length,
        playersCost: Number(playersCost.toFixed(2)),
        totalSpent: Number(totalSpent.toFixed(2)),
        dbRemainingBudget: Number(team.remainingBudget.toFixed(2)),
        calculatedRemaining: Number(calculatedRemaining.toFixed(2)),
        budgetMismatch: Math.abs(calculatedRemaining - team.remainingBudget) > 0.01,
        squadPlayerIds: team.squadPlayerIds || [],
        actualPlayers: teamPlayers.map(p => p.id),
        playersMismatch: (team.squadPlayerIds || []).length !== teamPlayers.length,
      }

      if (verification.budgetMismatch) {
        issues.push(`Team ${team.groupName}: Budget mismatch - DB shows ${team.remainingBudget} Cr, calculated ${calculatedRemaining.toFixed(2)} Cr`)
      }

      if (verification.playersMismatch) {
        issues.push(`Team ${team.groupName}: Player count mismatch - squadPlayerIds has ${team.squadPlayerIds?.length || 0}, but ${teamPlayers.length} players have currentTeam=${team.id}`)
      }

      return verification
    })

    stats.teams = teamVerifications

    // Verify players
    const soldPlayers = players.filter(p => p.status === 'Sold')
    const unsoldPlayers = players.filter(p => p.status === 'Unsold')
    
    stats.totalPlayers = players.length
    stats.soldPlayers = soldPlayers.length
    stats.unsoldPlayers = unsoldPlayers.length

    // Check for orphaned sold players (sold but no currentTeam)
    const orphanedPlayers = soldPlayers.filter(p => !p.currentTeam)
    if (orphanedPlayers.length > 0) {
      issues.push(`${orphanedPlayers.length} sold players have no currentTeam`)
      stats.orphanedPlayers = orphanedPlayers.map(p => ({ id: p.id, name: p.name }))
    }

    // Check for players with currentTeam but status=Unsold
    const incorrectStatusPlayers = players.filter(p => p.currentTeam && p.status === 'Unsold')
    if (incorrectStatusPlayers.length > 0) {
      issues.push(`${incorrectStatusPlayers.length} players have currentTeam but status is Unsold`)
      stats.incorrectStatusPlayers = incorrectStatusPlayers.map(p => ({ id: p.id, name: p.name, currentTeam: p.currentTeam }))
    }

    // Verify transactions
    const totalTransactionValue = transactions.reduce((sum, t) => sum + Math.abs(t.soldPrice), 0)
    stats.totalTransactions = transactions.length
    stats.totalTransactionValue = Number(totalTransactionValue.toFixed(2))

    // Summary
    stats.totalBudget = teams.length * settings.initialBudget
    stats.totalSpent = teams.reduce((sum, t) => sum + t.franchiseBid, 0) + soldPlayers.reduce((sum, p) => sum + (p.purchasePrice || 0), 0)
    stats.totalRemaining = teams.reduce((sum, t) => sum + t.remainingBudget, 0)
    stats.budgetBalance = Number((stats.totalBudget - stats.totalSpent - stats.totalRemaining).toFixed(2))

    if (Math.abs(stats.budgetBalance) > 0.01) {
      issues.push(`Budget balance mismatch: ${stats.budgetBalance} Cr (should be 0)`)
    }

    return NextResponse.json({
      ok: issues.length === 0,
      issues,
      stats,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('❌ Verification error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to verify database', details: String(error) },
      { status: 500 }
    )
  }
}

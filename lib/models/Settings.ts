import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema({
  initialBudget: { type: Number },
  minSquadSize: { type: Number },
  maxSquadSize: { type: Number },
  currentPhase: { 
    type: String, 
    enum: ['Team Auction', 'RTM/RTS Auction', 'Player Auction', 'Trading Window', 'Finalization'],
    default: 'Team Auction'
  },
  tradingWindowEnd: { type: Date, default: null },
}, { 
  timestamps: true,
  collection: 'settings'
})

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)

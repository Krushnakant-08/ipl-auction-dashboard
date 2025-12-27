import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema({
  initialBudget: { type: Number, default: 100 },
  minSquadSize: { type: Number, default: 7 },
  maxSquadSize: { type: Number, default: 11 },
  currentPhase: { 
    type: String, 
    enum: ['Team Auction', 'Player Auction', 'Trading Window', 'Finalization'],
    default: 'Team Auction'
  },
  tradingWindowEnd: { type: Date, default: null },
}, { 
  timestamps: true,
  collection: 'settings'
})

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)

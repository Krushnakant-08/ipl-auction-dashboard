import mongoose from 'mongoose'

const UnsoldPlayerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  role: { type: String, required: true },
  country: { type: String, required: true },
  basePrice: { type: Number, required: true },
  originalTeam: { type: String, default: null },
  auctionRound: { type: Number, default: 1 },
  insertOrder: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, { 
  timestamps: true,
  collection: 'unsold_players'
})

// Index for maintaining insertion order
UnsoldPlayerSchema.index({ insertOrder: 1 })
UnsoldPlayerSchema.index({ playerId: 1 })

export default mongoose.models.UnsoldPlayer || mongoose.model('UnsoldPlayer', UnsoldPlayerSchema)

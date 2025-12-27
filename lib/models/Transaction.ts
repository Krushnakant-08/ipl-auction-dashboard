import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  playerId: { type: String, required: true },
  playerName: { type: String, required: true },
  soldPrice: { type: Number, required: true },
  soldToTeam: { type: String, required: true },
  soldToTeamName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  rtmUsedBy: { type: String, default: null },
  rtsUsedBy: { type: String, default: null },
  type: { type: String, enum: ['sale', 'rtm', 'rts'], default: 'sale' },
}, { 
  timestamps: true,
  collection: 'transactions'
})

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)

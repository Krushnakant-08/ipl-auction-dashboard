import mongoose from 'mongoose'

const TradeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  proposedBy: { type: String, required: true },
  proposedByName: { type: String, required: true },
  proposedTo: { type: String, required: true },
  proposedToName: { type: String, required: true },
  offeredPlayers: [{ type: String }],
  offeredPlayerNames: [{ type: String }],
  requestedPlayers: [{ type: String }],
  requestedPlayerNames: [{ type: String }],
  status: { 
    type: String, 
    enum: ['Pending', 'Pending Admin Approval', 'Accepted', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  proposedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date, default: null },
  message: { type: String, default: '' },
}, { 
  timestamps: true,
  collection: 'trades'
})

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema)

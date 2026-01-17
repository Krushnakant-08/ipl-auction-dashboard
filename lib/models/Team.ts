import mongoose from 'mongoose'

const TeamSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  groupName: { type: String, required: true },
  franchiseName: { type: String, default: null },
  franchiseBid: { type: Number, default: 0 },
  remainingBudget: { type: Number, required: true },
  logo: { type: String, default: '' },
  squadPlayerIds: [{ type: String }],
  startingXI: { type: [String], default: [] },
  rtmCount: { type: Number, default: 0 },
  rtsCount: { type: Number, default: 0 },
  rtmUsed: { type: Boolean, default: false },
  rtsUsed: { type: Boolean, default: false },
  teamAuctionComplete: { type: Boolean, default: false },
}, { 
  timestamps: true,
  collection: 'teams'
})

export default mongoose.models.Team || mongoose.model('Team', TeamSchema)

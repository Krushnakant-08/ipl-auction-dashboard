import mongoose from 'mongoose'

const PlayerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['Batsman', 'Bowler', 'All-rounder', 'Wk/Batsman'] },
  basePrice: { type: Number, required: true },
  country: { type: String, required: true },
  originalTeam: { type: String, default: null },
  currentTeam: { type: String, default: null },
  purchasePrice: { type: Number, default: null },
  status: { type: String, enum: ['Unsold', 'Sold'], default: 'Unsold' },
}, { 
  timestamps: true,
  collection: 'players'
})

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema)

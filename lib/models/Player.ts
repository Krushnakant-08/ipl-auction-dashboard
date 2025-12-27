import mongoose from 'mongoose'

const PlayerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['Batsman', 'Bowler', 'All-rounder'] },
  basePrice: { type: Number, required: true },
  country: { type: String, required: true },
  ratings: {
    overall: { type: Number, default: 0 },
    powerplayBatting: { type: Number, default: 0 },
    powerplayBowling: { type: Number, default: 0 },
    middleOversBatting: { type: Number, default: 0 },
    middleOversBowling: { type: Number, default: 0 },
    deathOversBatting: { type: Number, default: 0 },
    deathOversBowling: { type: Number, default: 0 },
  },
  originalTeam: { type: String, default: null },
  currentTeam: { type: String, default: null },
  purchasePrice: { type: Number, default: null },
  status: { type: String, enum: ['Unsold', 'Sold'], default: 'Unsold' },
  isStarPlayer: { type: Boolean, default: false },
}, { 
  timestamps: true,
  collection: 'players'
})

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema)

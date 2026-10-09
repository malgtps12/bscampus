/**
 * Model User untuk menyimpan data pengguna
 */

import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Update timestamp sebelum save (gunakan function biasa, bukan arrow)
UserSchema.pre('save', function(next: any) {
  this.updatedAt = new Date()
  next()
})

export const User = mongoose.models.User || mongoose.model('User', UserSchema)

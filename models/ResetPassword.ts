/**
 * Model untuk menyimpan kode reset password
 * Menggunakan Mongoose dengan MongoDB
 */

import mongoose from 'mongoose'

const ResetPasswordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  codeHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL index: auto-delete setelah 10 menit (600 detik)
  }
})

// Index untuk mempercepat query dan TTL
ResetPasswordSchema.index({ email: 1 }, { unique: true })
ResetPasswordSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 })

export const ResetPassword = mongoose.models.ResetPassword || mongoose.model('ResetPassword', ResetPasswordSchema)

import { connectDB } from './mongodb'
import { ObjectId } from 'mongodb'

export interface PasswordResetCode {
  _id?: ObjectId
  user_id: string
  reset_code: string
  expires_at: Date
  used: boolean
  created_at: Date
}

export async function createResetCode(userId: string, resetCode: string): Promise<boolean> {
  try {
    const db = await connectDB()
    const resetCodes = db.collection<PasswordResetCode>('password_reset_codes')
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    const code = {
      user_id: userId,
      reset_code: resetCode,
      expires_at: expiresAt,
      used: false,
      created_at: new Date()
    }
    
    await resetCodes.insertOne(code)
    return true
  } catch (error) {
    console.error('Error creating reset code:', error)
    return false
  }
}

export async function deleteOldResetCodes(userId: string): Promise<boolean> {
  try {
    const db = await connectDB()
    const resetCodes = db.collection<PasswordResetCode>('password_reset_codes')
    
    await resetCodes.deleteMany({ user_id: userId, used: false })
    return true
  } catch (error) {
    console.error('Error deleting old codes:', error)
    return false
  }
}

export async function findResetCode(userId: string, code: string): Promise<PasswordResetCode | null> {
  try {
    const db = await connectDB()
    const resetCodes = db.collection<PasswordResetCode>('password_reset_codes')
    
    const resetCode = await resetCodes.findOne({
      user_id: userId,
      reset_code: code,
      used: false
    })
    
    return resetCode
  } catch (error) {
    console.error('Error finding reset code:', error)
    return null
  }
}

export async function markResetCodeUsed(id: ObjectId): Promise<boolean> {
  try {
    const db = await connectDB()
    const resetCodes = db.collection<PasswordResetCode>('password_reset_codes')
    
    const result = await resetCodes.updateOne(
      { _id: id },
      { $set: { used: true } }
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Error marking code used:', error)
    return false
  }
}

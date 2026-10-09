import { ObjectId } from 'mongodb'
import { connectDB } from './mongodb'

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password_hash: string
  created_at?: Date
  updated_at?: Date
}

export async function createUser(name: string, email: string, password_hash: string): Promise<string | null> {
  try {
    const db = await connectDB()
    const users = db.collection<User>('users')
    
    const user = {
      name,
      email,
      password_hash,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    const result = await users.insertOne(user as any)
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const db = await connectDB()
    const users = db.collection<User>('users')
    
    const user = await users.findOne({ email })
    return user
  } catch (error) {
    console.error('Error finding user:', error)
    return null
  }
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    const db = await connectDB()
    const users = db.collection<User>('users')
    
    const user = await users.findOne({ _id: new ObjectId(id) })
    return user
  } catch (error) {
    console.error('Error finding user by ID:', error)
    return null
  }
}

export async function updateUserPassword(id: string, password_hash: string): Promise<boolean> {
  try {
    const db = await connectDB()
    const users = db.collection<User>('users')
    
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: { password_hash, updated_at: new Date() } }
    )
    
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Error updating password:', error)
    return false
  }
}


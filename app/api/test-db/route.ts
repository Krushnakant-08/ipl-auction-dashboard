import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ 
      success: true, 
      message: '✅ MongoDB connected successfully!',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error)
    return NextResponse.json({ 
      success: false, 
      message: '❌ MongoDB connection failed',
      error: error.message 
    }, { status: 500 })
  }
}

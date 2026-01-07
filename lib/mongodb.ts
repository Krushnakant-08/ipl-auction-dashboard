import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  )
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

async function connectDB() {
  // Return existing connection if available and ready
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn
  }

  // If connection is not ready, reset promise to reconnect
  if (cached.conn && cached.conn.connection.readyState !== 1) {
    cached.promise = null
    cached.conn = null
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Optimize connection pooling for M0 cluster (max 500 connections)
      maxPoolSize: 10, // Limit concurrent connections per instance
      minPoolSize: 2,  // Keep minimum connections alive
      serverSelectionTimeoutMS: 5000, // Fail fast if server unavailable
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      // Connection management
      maxIdleTimeMS: 10000, // Close idle connections after 10s
      waitQueueTimeoutMS: 5000, // Max wait time for connection from pool
    }

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully')
      
      // Add connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err)
        cached.conn = null
        cached.promise = null
      })

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected')
        cached.conn = null
        cached.promise = null
      })

      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    cached.conn = null
    console.error('❌ MongoDB connection error:', e)
    throw e
  }

  return cached.conn
}

export default connectDB

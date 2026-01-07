import mongoose from 'mongoose'

/**
 * Utility to disconnect from MongoDB gracefully
 * Use this in cleanup scenarios or when testing
 */
export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
      console.log('✅ MongoDB disconnected successfully')
      
      // Clear the cached connection
      if (global.mongooseCache) {
        global.mongooseCache.conn = null
        global.mongooseCache.promise = null
      }
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error)
    throw error
  }
}

/**
 * Get current connection status
 */
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  return {
    state: states[mongoose.connection.readyState as keyof typeof states],
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
  }
}

/**
 * Check if database connection is healthy
 */
export async function checkDBHealth(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false
    }
    // Ping the database
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping()
      return true
    }
    return false
  } catch (error) {
    console.error('❌ DB health check failed:', error)
    return false
  }
}

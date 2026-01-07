// WebSocket client for real-time auction updates
// Falls back to polling on platforms that don't support WebSocket (like Vercel)
export class AuctionWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 2000
  private onUpdateCallback: ((data: any) => void) | null = null
  private shouldReconnect = true
  private pollingInterval: NodeJS.Timeout | null = null
  private usePolling = false
  private lastUpdate = 0

  connect(onUpdate: (data: any) => void) {
    // Prevent multiple connections
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    // If already polling, don't try WebSocket again
    if (this.usePolling && this.pollingInterval) {
      return
    }

    this.shouldReconnect = true
    this.onUpdateCallback = onUpdate

    // Check if running on Vercel or other platforms that don't support WebSocket
    const isVercel = window.location.hostname.includes('vercel.app')
    
    if (isVercel || this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Use polling instead of WebSocket on Vercel
      this.startPolling()
      return
    }

    try {
      // Use ws:// for local development, wss:// for production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}`
      
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        this.usePolling = false
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (this.onUpdateCallback) {
            this.onUpdateCallback(data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.warn('⚠️ WebSocket error, falling back to polling')
        this.startPolling()
      }

      this.ws.onclose = (event) => {
        this.ws = null
        if (this.shouldReconnect && event.code !== 1000) {
          this.reconnect()
        }
      }
    } catch (error) {
      console.warn('⚠️ WebSocket not available, using polling')
      this.startPolling()
    }
  }

  private startPolling() {
    if (this.pollingInterval) return
    
    this.usePolling = true
    console.log('🔄 Using polling for real-time updates')
    
    // Poll every 3 seconds to reduce database load
    this.pollingInterval = setInterval(async () => {
      try {
        // First, check if data has changed using lightweight sync endpoint
        const syncResponse = await fetch(`/api/auction/sync?t=${Date.now()}`, {
          cache: 'no-store',
        })
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          
          // Only fetch full data if lastUpdate has changed
          if (syncData.lastUpdate && syncData.lastUpdate !== this.lastUpdate) {
            const response = await fetch(`/api/auction?t=${Date.now()}`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
            })
            
            if (response.ok) {
              const data = await response.json()
              this.lastUpdate = syncData.lastUpdate
              if (this.onUpdateCallback) {
                this.onUpdateCallback(data)
              }
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000)
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  private reconnect() {
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        if (this.onUpdateCallback) {
          this.connect(this.onUpdateCallback)
        }
      }, this.reconnectDelay)
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Switch to polling after max reconnect attempts
      console.log('⚠️ Max WebSocket reconnect attempts reached, switching to polling')
      this.startPolling()
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
    // Polling doesn't send data, it only receives
  }

  disconnect() {
    this.shouldReconnect = false
    this.stopPolling()
    if (this.ws) {
      // Use standard close code 1000 for normal closure
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    this.onUpdateCallback = null
  }
}


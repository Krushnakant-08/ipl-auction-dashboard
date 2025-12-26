// WebSocket client for real-time auction updates
export class AuctionWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 2000
  private onUpdateCallback: ((data: any) => void) | null = null
  private shouldReconnect = true

  connect(onUpdate: (data: any) => void) {
    this.shouldReconnect = true
    this.onUpdateCallback = onUpdate

    try {
      // Use ws:// for local development, wss:// for production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws`
      
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
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
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        if (this.shouldReconnect) {
          this.reconnect()
        }
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.reconnect()
    }
  }

  private reconnect() {
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
      setTimeout(() => {
        if (this.onUpdateCallback) {
          this.connect(this.onUpdateCallback)
        }
      }, this.reconnectDelay)
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      // Use standard close code 1000 for normal closure
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    this.onUpdateCallback = null
  }
}

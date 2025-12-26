// Custom Next.js server with WebSocket support
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

// Suppress WebSocket error logs
const originalConsoleError = console.error
console.error = function(...args) {
  const errorString = args.join(' ')
  if (
    errorString.includes('WS_ERR_INVALID_CLOSE_CODE') ||
    errorString.includes('WS_ERR_INVALID_UTF8') ||
    errorString.includes('Invalid WebSocket frame')
  ) {
    return // Silently ignore WebSocket errors
  }
  originalConsoleError.apply(console, args)
}

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory auction state
let auctionState = {
  settings: null,
  teams: null,
  players: null,
  transactions: null,
  lastUpdate: Date.now(),
}

// Handle uncaught WebSocket errors globally  
process.on('uncaughtException', (error) => {
  if (error.code === 'WS_ERR_INVALID_CLOSE_CODE' || error.code === 'WS_ERR_INVALID_UTF8') {
    // Silently ignore invalid close codes and UTF-8 errors from browsers
    return
  }
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname } = parsedUrl

      // Handle auction API endpoints
      if (pathname === '/api/auction') {
        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(auctionState))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              // Validate JSON before parsing
              if (!body || body.trim().length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Empty request body' }))
                return
              }

              const data = JSON.parse(body)
              auctionState = {
                ...data,
                lastUpdate: Date.now(),
              }
              
              // Broadcast to all WebSocket clients
              wss.clients.forEach((client) => {
                if (client.readyState === 1) { // OPEN
                  client.send(JSON.stringify(auctionState))
                }
              })

              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true, lastUpdate: auctionState.lastUpdate }))
            } catch (error) {
              console.error('JSON Parse Error:', error.message, 'Body length:', body.length)
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Invalid JSON', details: error.message }))
            }
          })
          return
        }

        if (req.method === 'DELETE') {
          auctionState = {
            settings: null,
            teams: null,
            players: null,
            transactions: null,
            lastUpdate: Date.now(),
          }
          
          // Broadcast reset to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(auctionState))
            }
          })

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
          return
        }
      }

      // Handle all other requests with Next.js
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create WebSocket server with noServer option
  const wss = new WebSocketServer({ noServer: true })

  // Handle WebSocket upgrade requests
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  })

  wss.on('connection', (ws) => {
    // console.log('Client connected')

    // Send current state to newly connected client
    ws.send(JSON.stringify(auctionState))

    ws.on('close', (code, reason) => {
    //   console.log('Client disconnected')
    })

    ws.on('error', (error) => {
      // Silently handle invalid close codes and other WebSocket errors
      if (error.code !== 'WS_ERR_INVALID_CLOSE_CODE' && error.code !== 'WS_ERR_INVALID_UTF8') {
        console.error('WebSocket error:', error)
      }
    })
  })

  // Handle server-level WebSocket errors
  wss.on('error', (error) => {
    if (error.code !== 'WS_ERR_INVALID_CLOSE_CODE' && error.code !== 'WS_ERR_INVALID_UTF8') {
      console.error('WebSocket Server error:', error)
    }
  })

  server.listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server running`)
  })
})

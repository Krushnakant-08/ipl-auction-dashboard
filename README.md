# IPL Auction Dashboard

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/neelay-shahs-projects/v0-ipl-auction-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/kblpMKAUSJl)

## 📚 Documentation

- **[🚀 Local Setup Guide](./LOCALHOST_SETUP.md)** - Complete guide for running on your local network
- **[👥 Franchise Login Guide](./FRANCHISE_LOGIN_GUIDE.md)** - User authentication and permissions
- **[🔧 Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md)** - Fix common deployment issues

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- npm or pnpm package manager

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd ipl-auction-dashboard

# Install dependencies
npm install
# or
pnpm install
```

### Step 2: Database Setup

#### Option A: MongoDB Atlas (Recommended for Production)

1. **Create MongoDB Atlas Account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Create a new cluster (Free tier is sufficient)

2. **Configure Network Access:**
   - Go to "Network Access" in MongoDB Atlas
   - Click "Add IP Address"
   - For development: Add `0.0.0.0/0` (allow from anywhere)
   - For production: Add your deployment server IPs

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

#### Option B: Local MongoDB

```bash
# Install MongoDB locally
# Windows: Download from mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod
```

### Step 3: Environment Configuration

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ipl-auction?retryWrites=true&w=majority

# For local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/ipl-auction

# Password required to clear database (security measure)
CLEAR_DB_PASSWORD=cleardb123
```

**Important:** Change `CLEAR_DB_PASSWORD` to a secure password for production deployments!

### Step 4: Initialize the Database

**IMPORTANT:** You must initialize the database before using the application.

#### Method 1: Using the API (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Check database health:**
   - Open browser: `http://localhost:3000/api/health`
   - Should show: `"initialized": false`

3. **Initialize with mock data:**
   ```bash
   # Using curl
   curl -X POST http://localhost:3000/api/init

   # Or visit in browser and use a tool like Postman
   # POST http://localhost:3000/api/init
   ```

4. **Verify initialization:**
   - Check: `http://localhost:3000/api/health`
   - Should now show: `"initialized": true`
   - Teams count: 10, Players count: 140

#### Method 2: Using Browser

1. Start dev server: `npm run dev`
2. Use a REST client (Postman, Thunder Client, etc.)
3. Send POST request to `http://localhost:3000/api/init`

### Step 5: Access the Application

1. **Open the application:**
   ```
   http://localhost:3000
   ```

2. **Login as Admin:**
   - Password: `admin123`
   - You'll see the admin dashboard

### Step 6: Run Team Auction (Franchise Auction)

1. **Admin Dashboard:**
   - You'll see 10 groups waiting for franchise assignment
   - Available franchises: Mumbai Indians, Chennai Super Kings, etc.

2. **Assign Franchises:**
   - Click on a group
   - Select a franchise
   - Enter bid amount (max: ₹120 Cr by default)
   - Complete for all 10 groups

3. **Start Player Auction:**
   - Once all franchises are assigned
   - Click "Start Player Auction" button
   - System transitions to player auction phase

### Step 7: Franchise Login (Optional)

After franchise auction is complete:

1. **Get Network URL:**
   ```bash
   # Windows
   ipconfig
   # Look for IPv4 Address: e.g., 192.168.1.100
   
   # Mac/Linux
   ifconfig
   # Look for inet address
   ```

2. **Share with franchise users:**
   - URL: `http://YOUR_IP:3000/login`
   - Example: `http://192.168.1.100:3000/login`

3. **Franchise Login:**
   - Password: `franchise123`
   - Select their assigned team
   - Access franchise dashboard

### Step 8: Player Auction

1. **Admin Dashboard:**
   - View all 140 players
   - Select a player to auction
   - Choose team and enter bid amount
   - Player is assigned to team

2. **Franchise Dashboard:**
   - View your squad
   - See remaining budget
   - Track players in real-time

## 📋 Application Features

### Admin Features
- **Team Auction:** Assign franchises to groups with bid amounts
- **Player Auction:** Sell players to teams
- **RTM (Right to Match):** Each team can use RTM once
- **RTS (Right to Select):** Each team can use RTS once
- **Trading Window:** Open trading period with countdown
- **Settings:** Configure budget, squad size, and auction rules

### Franchise Features
- **Squad View:** See all purchased players
- **Budget Tracking:** Real-time budget updates
- **Player Details:** View player stats and roles
- **Trade Proposals:** Propose and respond to trades (during trading window)

### Real-Time Features
- All devices sync automatically
- Updates appear within 2-3 seconds
- WebSocket-based live updates
- Database-backed persistence

## 🔄 Database Management

### Check Database Status

```bash
# Health check
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "initialized": true,
    "collections": {
      "teams": 10,
      "players": 140,
      "settings": 1
    }
  }
}
```

### Reset Database

**Note:** Clearing the database now requires a password for security.

```bash
# Clear all data (will prompt for password in UI)
# Or use API directly with password:
curl -X DELETE http://localhost:3000/api/init \
  -H "Content-Type: application/json" \
  -d '{"password":"cleardb123"}'

# Re-initialize
curl -X POST http://localhost:3000/api/init
```

**Security:** The `CLEAR_DB_PASSWORD` is set in your `.env.local` file. Change it to a secure password for production!

### Verify Teams

```bash
curl http://localhost:3000/api/teams
```

### Verify Players

```bash
curl http://localhost:3000/api/players
```

## 🌐 Deployment to Production

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variable: `MONGODB_URI`
   - Deploy

3. **Initialize Production Database:**
   ```bash
   # Check health
   curl https://your-app.vercel.app/api/health
   
   # Initialize
   curl -X POST https://your-app.vercel.app/api/init
   
   # Verify
   curl https://your-app.vercel.app/api/teams
   ```

### Environment Variables for Deployment

In your deployment platform (Vercel, etc.), add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ipl-auction?retryWrites=true&w=majority
```

## 🔧 Troubleshooting

### "Team not found in database" Error

See [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) for detailed solutions.

Quick fix:
```bash
# Check if database is initialized
curl http://your-url/api/health

# If not initialized
curl -X POST http://your-url/api/init
```

### Database Connection Errors

1. Check `MONGODB_URI` in `.env.local`
2. Verify MongoDB Atlas IP whitelist
3. Ensure database user has correct permissions
4. Test connection string in MongoDB Compass

### Teams/Players Not Loading

1. Verify database is initialized: `/api/health`
2. Clear browser cache and refresh
3. Check browser console for errors
4. Re-initialize if needed: `POST /api/init`

## 📱 Login Credentials

- **Admin Password:** `admin123`
- **Franchise Password:** `franchise123`

**Note:** Change these in production by modifying the auth logic.

## 🔍 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check database status |
| `/api/init` | POST | Initialize database with mock data |
| `/api/init` | DELETE | Clear all data |
| `/api/teams` | GET | Get all teams |
| `/api/teams` | POST | Create team |
| `/api/teams` | PUT | Update team |
| `/api/players` | GET | Get all players |
| `/api/players` | PUT | Update player |
| `/api/auction` | GET | Get complete auction state |
| `/api/auction` | POST | Broadcast auction updates |
| `/api/settings` | GET | Get auction settings |
| `/api/settings` | PUT | Update settings |
| `/api/transactions` | GET | Get transaction history |
| `/api/trades` | GET/POST | Get/Create trades |

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Local Development & Network Access

### Running the Development Server

\`\`\`bash
npm run dev
\`\`\`

The server will start on:
- **Local:** http://localhost:3000
- **Network:** http://0.0.0.0:3000

### Accessing from Other Devices (Franchise Login)

To allow franchise users to login from other devices on the same network:

1. **Find your machine's IP address:**
   \`\`\`bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" under your active network adapter
   
   # Mac/Linux
   ifconfig
   # Look for "inet" address
   \`\`\`

2. **Share the network URL:**
   - Format: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

3. **Firewall Settings:**
   - Ensure port 3000 is allowed through your firewall
   - Windows: Check Windows Defender Firewall settings
   - Mac: Check System Preferences > Security & Privacy > Firewall

4. **Same Network Requirement:**
   - All devices must be on the same WiFi/LAN network
   - For external access, use port forwarding or tools like ngrok

### Login Credentials

- **Admin Password:** `admin123`
- **Franchise Password:** `franchise123`

Franchise users can select their team and login after the team auction is completed.

### Real-Time Synchronization

The application uses localStorage with automatic synchronization to keep all connected devices in sync:

- **Automatic Updates:** Changes made on any device (laptop/mobile) are automatically synced every 2 seconds
- **Auction State:** When admin starts player auction on laptop, mobile devices will automatically update
- **Player Sales:** When a player is sold, all devices see the update
- **Budget Updates:** Budget changes sync across all devices

**Important Notes:**
- All devices share the same auction state through browser localStorage
- Changes typically appear on other devices within 2-3 seconds
- If a device appears out of sync, refresh the browser page
- First-time setup requires admin to complete franchise auction before franchise users can login
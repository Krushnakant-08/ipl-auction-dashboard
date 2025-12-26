# IPL Auction Dashboard

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/neelay-shahs-projects/v0-ipl-auction-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/kblpMKAUSJl)

## 📚 Documentation

- **[🚀 Local Setup Guide](./LOCALHOST_SETUP.md)** - Complete guide for running on your local network
- **[👥 Franchise Login Guide](./FRANCHISE_LOGIN_GUIDE.md)** - User authentication and permissions

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

## Deployment

Your project is live at:

**[https://vercel.com/neelay-shahs-projects/v0-ipl-auction-dashboard](https://vercel.com/neelay-shahs-projects/v0-ipl-auction-dashboard)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/kblpMKAUSJl](https://v0.app/chat/kblpMKAUSJl)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

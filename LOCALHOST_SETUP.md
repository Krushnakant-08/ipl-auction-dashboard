# 🏏 IPL Auction Dashboard - Local Setup Guide

Complete guide for running the IPL Auction Dashboard on your local network for multi-device access.

---

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [Network Access](#network-access)
- [User Roles & Login](#user-roles--login)
- [Workflow Guide](#workflow-guide)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- All devices on the same WiFi network

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

### Run the Server

```bash
npm run dev
```

The server will start on:
- **Your Computer:** http://localhost:3000
- **Network Access:** http://0.0.0.0:3000

---

## 🌐 Network Access

### Step 1: Find Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active WiFi/Ethernet adapter (e.g., `192.168.1.4`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### Step 2: Share the URL

Your network URL format: `http://YOUR_IP:3000`

**Example:** If your IP is `192.168.1.4`, share:
```
http://192.168.1.4:3000
```

### Step 3: Connect Other Devices

1. **Ensure all devices are on the same WiFi**
2. **Open browser on mobile/tablet/other laptop**
3. **Enter the network URL** (e.g., http://192.168.1.4:3000)
4. **Login and start using!**

---

## 🔐 User Roles & Login

### Admin Access
- **Username:** Admin (no selection needed)
- **Password:** `admin123`
- **Capabilities:**
  - ✅ Conduct franchise auctions
  - ✅ Start player auctions
  - ✅ Sell players to teams
  - ✅ View all team budgets
  - ✅ Access all pages
  - ✅ Manage settings
  - ✅ Undo transactions

### Franchise Access
- **Username:** Select your franchise from dropdown
- **Password:** `franchise123`
- **Capabilities:**
  - ✅ View your team dashboard
  - ✅ See your squad and players
  - ✅ Track your budget
  - ✅ Monitor auction progress
  - ❌ Cannot see other teams' budgets
  - ❌ Cannot access player pool
  - ❌ Cannot conduct auctions

---

## 📱 Workflow Guide

### Phase 1: Setup (Admin Only - On Main Computer)

1. **Login as Admin**
   - Open http://localhost:3000
   - Click "Admin Access"
   - Enter password: `admin123`

2. **Navigate to Live Auction**
   - Click "Live Auction" in the navigation

### Phase 2: Franchise Auction (Admin Only)

3. **Assign Franchises to Teams**
   - Select a group (e.g., "Group Alpha")
   - Select an available franchise (e.g., "Mumbai Warriors")
   - Enter bid amount (e.g., 10 Cr)
   - Click "Assign Franchise"
   - Repeat for all teams

### Phase 3: Start Player Auction (Admin Only)

4. **Start Player Auction**
   - After all teams have franchises
   - Click "Start Player Auction" button
   - **🎯 This enables franchise users to login!**

### Phase 4: Franchise Login (Other Devices)

5. **Franchise Users Login**
   - Open http://192.168.1.4:3000 (use your IP)
   - Click "Franchise Access"
   - Enter password: `franchise123`
   - Select your franchise from dropdown
   - Click "Login as Franchise"

### Phase 5: Player Auction (Admin - Live Updates for All)

6. **Sell Players**
   - Admin selects unsold player
   - Admin selects buying team
   - Admin enters sold price
   - Click "Confirm Sale"
   - **All franchise devices see updates within 1 second!**

7. **Franchise View Updates Automatically**
   - Squad updates in real-time
   - Budget decreases automatically
   - Dashboard charts update live

---

## 🔄 Real-Time Synchronization

The application uses **server-side state management** with **1-second polling**:

- ✅ Changes on admin device appear on all franchise devices within 1 second
- ✅ Player sales update across all devices automatically
- ✅ Budget changes sync in real-time
- ✅ Auction phase changes (Team → Player) sync instantly
- ✅ No manual refresh needed

**How it works:**
- Admin makes changes → Saved to server → All devices fetch updates every second

---

## 🛠️ Troubleshooting

### Problem: Franchise users can't see "Player Auction" phase

**Solution:**
1. Admin must complete franchise auction for ALL teams first
2. Admin must click "Start Player Auction" button
3. Wait 1-2 seconds for sync
4. Franchise users refresh their browser

### Problem: Mobile can't connect to laptop

**Solutions:**

1. **Check Firewall**
   ```
   Windows: Settings → Privacy & Security → Windows Firewall
   Allow port 3000 through firewall
   ```

2. **Verify Same Network**
   - Both devices must be on same WiFi
   - Not guest network or different SSIDs

3. **Test Connection**
   ```bash
   # From mobile, use browser to visit:
   http://YOUR_LAPTOP_IP:3000
   ```

4. **Disable VPN**
   - Turn off VPN on laptop
   - VPN can block local network access

### Problem: Changes not syncing between devices

**Solutions:**

1. **Refresh Browser**
   - Pull down to refresh on mobile
   - Ctrl+R or Cmd+R on desktop

2. **Check Console for Errors**
   - Right-click → Inspect → Console tab
   - Look for API errors

3. **Restart Server**
   ```bash
   # Stop server (Ctrl+C)
   # Restart
   npm run dev
   ```

### Problem: "Do auction first" message on mobile

**Cause:** Server state not initialized or out of sync

**Solution:**
1. Admin should complete franchise auction again
2. Admin clicks "Start Player Auction"
3. All devices refresh browser
4. Wait 2-3 seconds for sync

---

## 📊 Features

### For Admin
- Complete auction control
- Real-time player sales
- Budget management for all teams
- Transaction history
- Undo last transaction
- RTM (Right to Match) support
- RTS (Right to Sell) support

### For Franchise
- Personal team dashboard
- Squad composition view
- Budget tracking
- Role distribution charts
- Top acquisitions list
- Live auction updates

---

## 🔒 Security Notes

- **Demo Passwords:** Hardcoded for simplicity
- **Production Use:** Implement proper authentication
- **Network Security:** Keep on private WiFi
- **Data Persistence:** State stored in server memory (resets on restart)

---

## 💡 Tips

1. **Use Laptop/Desktop for Admin:** Easier to manage auction
2. **Mobile for Franchises:** Better viewing experience
3. **Keep Devices Awake:** Prevent sleep/lock during auction
4. **Stable WiFi:** Ensure strong connection for all devices
5. **Refresh if Stuck:** Ctrl+R or pull-down refresh usually fixes issues

---

## 📞 Common Questions

**Q: Can franchise users bid on players?**  
A: No, this is a simulation. Admin manages all auctions.

**Q: Can I run this over the internet?**  
A: Yes, but requires port forwarding or tools like ngrok.

**Q: Does data persist after restart?**  
A: No, server state is in-memory. Restarting clears everything.

**Q: How many devices can connect?**  
A: Unlimited, as long as they're on the same network.

**Q: Can I change passwords?**  
A: Yes, edit `lib/auth-context.tsx` (lines 19-20).

---

## 🎯 Example Session

```
1. Admin (Laptop): Login → Franchise Auction → Assign 8 teams
2. Admin (Laptop): Click "Start Player Auction"
3. Franchise 1 (Mobile): Login → See team dashboard
4. Franchise 2 (Tablet): Login → See team dashboard
5. Admin (Laptop): Sell Player 1 to Franchise 1 for 5 Cr
6. Franchise 1 (Mobile): Sees update - budget decreases, player added
7. Admin (Laptop): Sell Player 2 to Franchise 2 for 3 Cr
8. Franchise 2 (Tablet): Sees update - budget decreases, player added
9. All devices stay in sync throughout auction!
```

---

## 📝 Quick Reference

| Action | Role | Device | URL |
|--------|------|--------|-----|
| Start Server | Admin | Laptop | `npm run dev` |
| Admin Login | Admin | Laptop | http://localhost:3000 |
| Franchise Login | Franchise | Any | http://YOUR_IP:3000 |
| Password (Admin) | - | - | `admin123` |
| Password (Franchise) | - | - | `franchise123` |

---

## 🎉 Ready to Start!

1. Run `npm run dev`
2. Find your IP address
3. Admin logs in on laptop
4. Complete franchise auction
5. Start player auction
6. Share IP with franchise users
7. Begin live auction!

**Happy Auctioning! 🏏**

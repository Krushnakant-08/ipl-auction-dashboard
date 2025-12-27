# 🚀 Quick Start - MongoDB Setup

## 1️⃣ Get MongoDB Connection String (2 minutes)

1. Visit: https://cloud.mongodb.com
2. Sign up / Login
3. Create free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy connection string

## 2️⃣ Configure Environment (30 seconds)

Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ipl-auction?retryWrites=true&w=majority
```

Replace:
- `username` → your MongoDB username
- `password` → your MongoDB password
- `cluster` → your cluster name

## 3️⃣ Whitelist IP (1 minute)

In MongoDB Atlas:
- Network Access → Add IP Address
- Choose "Allow Access from Anywhere" (0.0.0.0/0)

## 4️⃣ Start & Initialize (1 minute)

```bash
npm run dev
```

Visit: http://localhost:3000/settings

Click "Initialize Database" button

## ✅ Done!

Your app now uses MongoDB. All data persists and syncs across devices!

---

## 🔥 Quick Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start

# Test MongoDB connection
# Visit: http://localhost:3000/api/teams
```

---

## 🌐 For Production (Vercel)

1. Push to GitHub
2. Vercel → Settings → Environment Variables
3. Add `MONGODB_URI` with your connection string
4. Add `NEXT_PUBLIC_API_URL` with Vercel URL
5. Redeploy

---

## 💡 Key URLs

| Purpose | URL |
|---------|-----|
| Admin Dashboard | http://localhost:3000 |
| Settings & DB Init | http://localhost:3000/settings |
| Teams API | http://localhost:3000/api/teams |
| Players API | http://localhost:3000/api/players |
| Initialize DB | http://localhost:3000/api/init (POST) |

---

## 🆘 Common Issues

**Connection Failed?**
- Check IP whitelist in MongoDB Atlas
- Verify username/password in `.env.local`

**Data Not Persisting?**
- Check console for MongoDB connection logs
- Ensure `.env.local` exists in project root

**Not Syncing Across Devices?**
- All devices must connect to same MongoDB
- Check WebSocket connection in console

---

**Need detailed help?** See [MONGODB_SETUP.md](./MONGODB_SETUP.md)

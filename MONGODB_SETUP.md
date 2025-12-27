# MongoDB Setup Guide for IPL Auction Dashboard

## ✅ What's Been Completed

Your IPL Auction Dashboard now uses **MongoDB** instead of localStorage! All auction data (teams, players, settings, transactions, trades) is now stored in a MongoDB database and synced across all devices in real-time.

## 🚀 Setup Instructions

### 1. Create a MongoDB Atlas Account (Free)

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new cluster (select the free M0 tier)
4. Wait for the cluster to be created (2-3 minutes)

### 2. Get Your MongoDB Connection String

1. In MongoDB Atlas, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string (it looks like this):
   \`\`\`
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   \`\`\`
4. Replace `<password>` with your actual database password
5. Add the database name after `.net/`: `ipl-auction`

   Final format:
   \`\`\`
   mongodb+srv://username:yourpassword@cluster0.xxxxx.mongodb.net/ipl-auction?retryWrites=true&w=majority
   \`\`\`

### 3. Configure Your Environment

1. Open `.env.local` in your project root
2. Replace the `MONGODB_URI` value with your connection string:
   \`\`\`env
   MONGODB_URI=mongodb+srv://your-actual-connection-string
   NEXT_PUBLIC_API_URL=http://localhost:3000
   \`\`\`

### 4. Whitelist Your IP Address

In MongoDB Atlas:
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Either:
   - Click **"Add Current IP Address"** for local development
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0) for production/Vercel

### 5. Create a Database User

In MongoDB Atlas:
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Create a username and password
4. Set permissions to **"Read and write to any database"**
5. Click **"Add User"**

### 6. Deploy to Vercel

When deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add `MONGODB_URI` with your connection string
4. Add `NEXT_PUBLIC_API_URL` with your Vercel deployment URL
5. Redeploy your app

## 🎯 What Changed

### Files Created:
- ✅ `.env.local` - Environment variables (MongoDB connection string)
- ✅ `lib/mongodb.ts` - MongoDB connection handler
- ✅ `lib/models/Team.ts` - Team mongoose model
- ✅ `lib/models/Player.ts` - Player mongoose model
- ✅ `lib/models/Settings.ts` - Settings mongoose model
- ✅ `lib/models/Transaction.ts` - Transaction mongoose model
- ✅ `lib/models/Trade.ts` - Trade mongoose model
- ✅ `app/api/teams/route.ts` - Teams API endpoints
- ✅ `app/api/players/route.ts` - Players API endpoints
- ✅ `app/api/settings/route.ts` - Settings API endpoints
- ✅ `app/api/transactions/route.ts` - Transactions API endpoints
- ✅ `app/api/trades/route.ts` - Trades API endpoints

### Files Modified:
- ✅ `app/api/auction/route.ts` - Updated to use MongoDB instead of in-memory storage

### Dependencies Added:
- ✅ `mongodb` - MongoDB driver
- ✅ `mongoose` - MongoDB ODM (Object Data Modeling)

## 🔥 Features Now Available

✅ **Persistent Data** - Data survives server restarts
✅ **Multi-Device Sync** - Updates on admin device are visible on all other devices
✅ **Real-time Updates** - WebSocket ensures instant synchronization
✅ **Scalable** - Can handle multiple concurrent users
✅ **Production Ready** - Works seamlessly on Vercel

## 🧪 Testing

1. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Check MongoDB connection:**
   - Look for "✅ MongoDB connected successfully" in the console
   - If you see errors, double-check your `.env.local` file

3. **Test data persistence:**
   - Add a team or player in the admin dashboard
   - Open the app in another browser/device
   - You should see the same data!

## ⚠️ Important Notes

- **Security**: Never commit `.env.local` to Git (already in `.gitignore`)
- **Connection String**: Keep your MongoDB password secure
- **Network Access**: For production, whitelist Vercel IP ranges or use "Allow from Anywhere"
- **Free Tier Limits**: MongoDB Atlas free tier has 512MB storage (plenty for auction data)

## 🆘 Troubleshooting

### "MongoServerError: Authentication failed"
- Double-check your username and password in the connection string
- Make sure you created a database user in MongoDB Atlas

### "MongooseServerSelectionError: connect ECONNREFUSED"
- Check if your IP address is whitelisted in MongoDB Atlas
- Verify the connection string in `.env.local`

### "Error: Please define the MONGODB_URI environment variable"
- Make sure `.env.local` exists in the project root
- Restart your development server after adding environment variables

### Data not syncing across devices
- Check if WebSocket is connected (look for console logs)
- Verify all devices are pointing to the same MongoDB database
- Try refreshing the page to force a data fetch

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Need Help?** Check the console logs for detailed error messages!

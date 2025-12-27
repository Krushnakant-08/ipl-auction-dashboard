# Franchise Login Feature - Implementation Guide

## Overview

The IPL Auction Dashboard now includes a comprehensive authentication system with **role-based access control**, allowing both **Admin** and **Franchise** users to access the platform with different permissions and views.

## Features Implemented

### 1. **Authentication System**
- Role-based login with password authentication
- Two user roles: **Admin** and **Franchise**
- Persistent sessions using localStorage
- Automatic route protection and redirection
- **Admin Password:** `admin123`
- **Franchise Password:** `franchise123`

### 2. **Admin Access (Full Control)**
Admin users have complete access to all features:
- ✅ View all teams' budgets and squad details
- ✅ Conduct team franchise auctions
- ✅ Manage player auctions
- ✅ View all player prices and purchase details
- ✅ Access auction settings
- ✅ Undo transactions
- ✅ Complete dashboard with analytics for all teams

### 3. **Franchise Access (Limited View)**
Franchise users have restricted access focused on their own team:
- ✅ View only their own team's budget and remaining purse
- ✅ View only their own squad and players
- ✅ **Cannot see other franchises' budgets or purses**
- ✅ **Cannot see other teams' player purchase prices** (shown as ●●●●)
- ✅ View auction progress
- ❌ Cannot access player pool
- ❌ Cannot access auction management
- ❌ Cannot access settings
- ❌ Cannot view all teams page

### 4. **New Components**

#### Login Page (`/login`)
- Beautiful dual-card interface
- Admin login option with password (`admin123`)
- Franchise login with password (`franchise123`)
- Franchise selection dropdown (only shows completed franchises)
- Role-specific feature descriptions
- Password validation and error handling

#### Franchise Dashboard
- Personalized team overview
- Budget tracking and squad composition
- Role distribution charts
- Top acquisitions display
- Complete squad table with player details

#### Updated Navigation
- Role-based menu items
- User info display with role badge
- Logout functionality
- Dynamic routing based on permissions

### 5. **Data Privacy Features**

Franchise users see **masked information** for other teams:
- Other teams' names: `●●●●●`
- Other teams' player prices: `●●●●`
- Only their own team's complete data is visible

## File Structure

\`\`\`
lib/
├── auth-context.tsx          # Authentication context and logic
├── types.ts                  # Added User and UserRole types
└── auction-context.tsx       # Existing auction logic (unchanged)

app/
├── login/
│   └── page.tsx             # New login page
├── page.tsx                 # Updated with role-based dashboard
├── layout.tsx               # Wrapped with AuthProvider
├── players/page.tsx         # Updated with data masking
├── squads/page.tsx          # Updated with team filtering
└── [other pages remain unchanged for admin]

components/
├── franchise-dashboard.tsx   # New franchise-specific dashboard
└── navigation.tsx           # Updated with role-based menu
\`\`\`

## How to Use

### 1. **Starting the Application**
\`\`\`bash
npm install
npm run dev
\`\`\`

### 2. **First Time Access**
- Navigate to `http://localhost:3000`
- You'll be automatically redirected to `/login`

### 3. **Admin Login**
- Click "Login as Admin" button
- Full access to all features
- Can conduct auctions and view all data

### 4. **Franchise Login**
1. Select your franchise from the dropdown
   - Note: Franchises only appear after team auction is complete
2. Click "Login as Franchise"
3. View your personalized dashboard

### 5. **Logging Out**
- Click the "Logout" button in the navigation bar
- Returns to login page
- Session cleared

## Key Implementation Details

### Authentication Flow
\`\`\`typescript
User logs in → Role assigned (admin/franchise) → 
Stored in localStorage → Routes protected → 
Components render based on role
\`\`\`

### Route Protection
- Public routes: `/login`
- Admin-only routes: `/auction`, `/settings`, `/teams`
- Shared routes: `/`, `/players`, `/squads` (with filtered data)

### Data Filtering
Franchise users see:
- **Dashboard**: Only their team's stats and players
- **Players Page**: All players, but prices/teams masked except their own
- **Squads Page**: Only their squad (no tabs for other teams)
     
## Security Notes

⚠️ **Important**: This is a demo authentication system suitable for:
- Development and testing
- Internal team use
- Demonstration purposes

For production use, implement:
- Real authentication backend
- Password protection
- JWT tokens or session management
- Server-side route protection
- API security

## Testing the Feature

### Test Scenario 1: Admin Access
1. Login as Admin
2. Complete team auction for at least 2 teams
3. Conduct player auction
4. Verify you can see all teams' budgets and purchases

### Test Scenario 2: Franchise Access
1. Logout from admin
2. Login as a franchise
3. Verify you see only your team's dashboard
4. Check players page - other teams' data should be masked
5. Navigate to squads - only your squad should be visible
6. Try accessing `/auction` or `/teams` - should redirect to dashboard

### Test Scenario 3: Data Privacy
1. Login as Franchise A
2. Note Franchise A's budget and players
3. Logout and login as Franchise B
4. Verify you cannot see Franchise A's specific data
5. Check that player prices from other teams are masked

## Future Enhancements

Potential improvements:
- [ ] Real authentication with email/password
- [ ] OAuth integration (Google, GitHub)
- [ ] Team-specific notifications
- [ ] Bidding interface for franchises during live auction
- [ ] Real-time updates using WebSockets
- [ ] Franchise owner profile management
- [ ] Auction history filtering by team

## Troubleshooting

**Issue**: Cannot see franchise in dropdown
- **Solution**: Complete the team auction first as admin

**Issue**: Redirected to login immediately
- **Solution**: Clear localStorage and try again

**Issue**: Can still see other teams' data as franchise
- **Solution**: Check browser console for errors, ensure you're logged in as franchise role

## Support

For issues or questions about the franchise login feature, check:
- Browser console for errors
- localStorage for user data (`ipl-auction-user` key)
- TypeScript errors in VS Code

# 📊 BlackBook

A modern social trading journal for tracking options and stock trades with a community feed. Built with React, TypeScript, Express, and PostgreSQL.

## ✨ Features

### Trading Journal
- **Multi-Strategy Support**: Track 18+ options strategies including Iron Condors, Spreads, Straddles, and simple stock positions
- **Position Management**: Roll trades, adjust positions, and track the complete lifecycle of your trades
- **Smart P&L Calculations**: Automatic P&L tracking with proper multipliers (1x for stocks, 100x for options contracts)
- **Expiration Tracking**: See what your trades would have been worth at expiration (for closed options trades)
- **Live Quotes**: Real-time price updates for open positions (Alpha Vantage integration)

### Social Features
- **Community Feed**: Share winning trades and learn from others
- **Engagement**: Like and comment on trades
- **Feed Filters**: View all trades, winners only, losers only, or filter by status

### User Experience
- **Dark/Light Theme**: Fully themed UI with system preference detection
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Real-time Updates**: Powered by React Query for instant UI updates
- **Form Validation**: Zod schemas ensure data integrity

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast dev server and build tool
- **TanStack Query** (React Query) - Server state management
- **Wouter** - Lightweight routing
- **shadcn/ui** + **Radix UI** - Beautiful, accessible components
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** + **Zod** - Type-safe forms

### Backend
- **Express.js** - Fast, minimal web framework
- **TypeScript** - Type safety across the stack
- **Drizzle ORM** - Type-safe PostgreSQL queries
- **bcrypt** - Password hashing
- **express-session** - Session management
- **Alpha Vantage API** - Stock price quotes

### Database
- **PostgreSQL** - Production-ready relational database
- **MemoryStore** - In-memory session storage (dev)

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (optional - uses in-memory storage by default)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/justinpreston/blackbook.git
   cd blackbook
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables (optional)**
   ```bash
   # Create .env file
   SESSION_SECRET=your-secret-key-change-in-production
   ALPHA_VANTAGE_API_KEY=your-api-key  # For live stock quotes
   DATABASE_URL=postgresql://user:pass@host:port/db  # For PostgreSQL
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Access the app**
   ```
   http://localhost:5000
   ```

## 🎯 Usage

### First Time Setup
1. Navigate to the app
2. You'll be redirected to `/auth` to create an account
3. Click "Create one" to register
4. Enter username, display name, and password (min 6 characters)
5. You'll be auto-logged in and redirected home

### Creating Trades

**Stock Trade:**
1. Click "New Trade"
2. Select "Stock" strategy
3. Enter ticker, quantity (shown as "Shares"), entry price
4. Add optional notes and max profit/loss
5. Toggle "Share" to post to community feed

**Options Trade:**
1. Click "New Trade"
2. Select strategy (e.g., "Bull Call Spread", "Iron Condor")
3. Enter ticker, quantity (shown as "Contracts"), entry price
4. Configure legs (strike prices, expiration, premiums)
5. Set status (OPEN/CLOSED/PARTIAL) and dates

### Managing Positions
- **Roll a Trade**: Click the roll icon on an open trade to close it and open a new position at different strikes/expiration
- **Edit**: Click pencil icon (owner only)
- **Share**: Toggle share button to post to community feed
- **Like & Comment**: Engage with community trades

### Tabs
- **Home**: Community feed with all shared trades
- **My Trades**: Your personal trade journal

### Filters
- **All**: Show all trades
- **Open**: Active positions only
- **Closed**: Completed trades only
- **Winners**: Profitable trades only
- **Losers**: Loss trades only

## 🔐 Authentication

BlackBook uses **session-based authentication** with the following security features:

- **Password Hashing**: bcrypt with 10 rounds
- **Secure Sessions**: 7-day cookie expiration, httpOnly, sameSite=lax
- **Protected Routes**: All trade operations require authentication
- **Ownership Validation**: Users can only edit/delete their own trades
- **Password Separation**: Passwords stored separately and never returned in API responses

### API Endpoints

**Auth:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/users/me` - Get current user (requires auth)

**Trades:**
- `GET /api/trades/shared` - Community feed
- `GET /api/trades/mine` - User's trades (requires auth)
- `POST /api/trades` - Create trade (requires auth)
- `PUT /api/trades/:id` - Update trade (requires auth + ownership)
- `POST /api/trades/:id/roll` - Roll trade (requires auth + ownership)
- `POST /api/trades/:id/like` - Toggle like (requires auth)
- `POST /api/trades/:id/share` - Toggle share (requires auth + ownership)

## 🏗️ Project Structure

```
blackbook/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── trade-card.tsx
│   │   │   └── ...
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                # Backend Express app
│   ├── index.ts           # Server setup + session config
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Data access layer
│   ├── alpha-vantage.ts   # Stock quote API
│   └── vite.ts            # Dev server integration
├── shared/                # Shared code
│   └── schema.ts          # Zod schemas + TypeScript types
└── package.json
```

## 🛠️ Development

### Build for production
```bash
npm run build
npm start
```

### Database migrations
```bash
npm run db:push
```

### Type checking
```bash
npm run check
```

## 🎨 Design Philosophy

BlackBook follows a **hybrid system-based approach** with modern fintech aesthetics:

- **shadcn/ui** component library for consistency
- **Robinhood-inspired** approachability
- **Linear-inspired** refined execution
- Clean typography with Inter font
- Balanced professional trading credibility with social features

## 📝 Supported Trading Strategies

### Simple
- Long Call
- Long Put
- Stock

### Vertical Spreads
- Bull Call Spread
- Bear Call Spread
- Bull Put Spread
- Bear Put Spread

### Advanced Multi-Leg
- Iron Condor (4 legs)
- Iron Butterfly (4 legs)
- Long Straddle
- Long Strangle
- Calendar Spread
- Diagonal Spread
- Butterfly Spread (3 legs)
- Covered Call
- Protective Put

## 🤝 Contributing

Contributions are welcome! This is a personal project, but feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Design inspired by Robinhood and Linear
- Icons by [Lucide](https://lucide.dev/)

---

**Note**: This project uses in-memory storage by default. For production use, configure PostgreSQL via the `DATABASE_URL` environment variable and implement the database-backed storage layer using Drizzle ORM.

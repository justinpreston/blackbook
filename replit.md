# BlackBook Trading Journal

## Overview

BlackBook is a social trading journal web application for logging and sharing stock and options trades. Users can track their positions, record profit/loss, share trades with their team, and engage through likes and comments. The app supports various trading strategies from simple calls/puts to complex multi-leg options strategies like iron condors and butterflies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens, CSS variables for theming
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/` (shadcn)
- Feature-specific components in `client/src/components/`
- Custom hooks in `client/src/hooks/`
- Theme support (light/dark mode) via ThemeProvider

### Key Features
- **Tab-based Navigation**: Home (team's shared trades) and My Trades (personal trades)
- **Trade Sharing**: Trades default to private; users toggle sharing via switches on My Trades tab
- **Compact Grid Layout**: Trades display in responsive grid with 2-4 columns based on screen size
- **Social Features**: Like and comment on shared trades
- **Live Pricing**: Alpha Vantage integration for real-time stock prices on open trades
- **Expiration Tracking**: Closed trades show "what-if" analysis comparing actual exit vs holding to expiration
- **Edit Trades**: Trade owners can edit their trades with automatic P&L recalculation

### Edit Trade Feature
- **Access**: Edit button (Pencil icon) visible only to trade owners on trade cards
- **Form**: NewTradeForm component supports both create and edit modes
- **Schema Field**: `editedAt` (nullable string) tracks when trade was last edited
- **UI Indicator**: "(edited)" text appears next to trader name for modified trades
- **Behavior**: 
  - Pre-fills form with existing trade data
  - Preserves shared status when editing
  - Recalculates P&L when exit price changes
  - Resets expiration tracking fields on edit
- **API Endpoint**: PUT `/api/trades/:id` updates trade and sets editedAt timestamp

### Position Tracking & Rolling Feature
- **Purpose**: Track positions across multiple trades when rolling to different strikes/expirations
- **Schema Fields**: 
  - `positionId` (nullable string): Unique ID linking trades in the same position chain
  - `adjustmentType` (nullable string): "OPEN" | "ROLL" | "ADJUST" | "CLOSE_OUT"
  - `parentTradeId` (nullable string): Links rolled trade to its parent
- **ADJUSTMENT_TYPES Constant**: Metadata for each adjustment type (name, description)
- **Roll Workflow**:
  1. User clicks purple Roll button on open trade
  2. RollTradeForm opens with dual-pane UI (closing/opening sections)
  3. User fills exit price for closing position and entry details for new position
  4. API closes parent trade with P&L calculation, creates new trade linked via positionId
- **UI Display**:
  - Purple Roll button (RotateCcw icon) visible on owner's open trades
  - Adjustment badges (Roll/Adjust/Close Out) displayed on trade cards for non-OPEN types
  - Rolled trades inherit shared status from parent
- **API Endpoints**:
  - POST `/api/trades/:id/roll` - Closes parent and creates new rolled trade
  - GET `/api/positions/open` - List user's open positions
  - GET `/api/positions/:positionId/trades` - Get all trades in a position chain
- **Storage Methods**: `getUserOpenPositions`, `getPositionTrades`

### Exit Date Validation
- **Requirement**: Exit date is required when closing options trades (all strategies except STOCK)
- **Frontend**: Zod refine validation + dynamic form label showing "(required)" vs "(optional)"
- **Backend**: Validation in POST/PUT routes with empty string normalization to null
- **UX**: Form shows validation error if exit date missing when closing options trade

### Expiration Tracking System
- **Purpose**: Analyze if closing early was the right decision
- **Schema Fields**: `expirationStockPrice`, `theoreticalExitValue`, `missedPnl` (all nullable on Trade)
- **Calculation Logic**: 
  - Uses position multiplier to distinguish debit vs credit trades
  - Derives direction from net premium flow (leg premiums) or strategy type fallback
  - `missedPnl` = (expiration P&L - actual P&L) × contracts × 100
- **UI Display**: 
  - Amber badge: "If held to expiry" (positive missedPnl = missed opportunity)
  - Green badge: "Good exit!" (negative missedPnl = saved money)
- **API Endpoint**: POST `/api/trades/:id/calculate-expiration` triggers calculation

### Alpha Vantage Integration
- **Service**: `server/alpha-vantage.ts` handles API calls with 5-minute caching
- **Endpoints**: 
  - GET `/api/quotes/:symbol` - Single stock quote
  - GET `/api/quotes/trades/open` - Quotes for all open trades
- **Rate Limits**: Free tier allows 25 requests/day, 5/minute (caching reduces API calls)
- **Environment Variable**: `ALPHA_VANTAGE_API_KEY` (stored as secret)
- **UI Display**: Open trade cards show current price and calculated live P&L

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Style**: RESTful JSON API under `/api/*` routes
- **Development**: Vite dev server with HMR proxied through Express

The server uses a simple modular structure:
- `server/index.ts`: Express app setup and middleware
- `server/routes.ts`: API route handlers
- `server/storage.ts`: Data access layer (currently in-memory, interface-ready for database)
- `server/vite.ts`: Development server integration
- `server/static.ts`: Production static file serving

### Data Layer
- **Schema Definition**: Zod schemas in `shared/schema.ts` for validation
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Current Storage**: In-memory `MemStorage` class implementing `IStorage` interface
- **Database Ready**: Drizzle config points to PostgreSQL via `DATABASE_URL`

The storage interface pattern allows easy swapping between in-memory storage (for development) and PostgreSQL (for production).

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- Type definitions for trades, users, comments, and stats
- Trading strategy definitions with metadata (name, emoji, leg count, category)
- Zod validation schemas for API payloads

### Build System
- Development: `tsx` for TypeScript execution, Vite for frontend
- Production: esbuild bundles server, Vite builds client to `dist/`
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database (Drizzle ORM configured)
- **connect-pg-simple**: Session storage for PostgreSQL

### UI Libraries
- **Radix UI**: Headless component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **date-fns**: Date formatting utilities
- **react-day-picker**: Calendar component

### Development Tools
- **Vite**: Frontend build tool and dev server
- **Drizzle Kit**: Database migration tooling
- **esbuild**: Production server bundling

### Validation
- **Zod**: Schema validation for API requests and form data
- **@hookform/resolvers**: Zod integration with React Hook Form
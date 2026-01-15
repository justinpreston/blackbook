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
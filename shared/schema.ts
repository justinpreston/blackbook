import { z } from "zod";

// Strategy definitions with metadata
export const STRATEGIES = {
  // Simple Options
  LONG_CALL: { name: "Long Call", emoji: "📈", legs: 1, category: "simple" },
  LONG_PUT: { name: "Long Put", emoji: "📉", legs: 1, category: "simple" },
  STOCK: { name: "Stock", emoji: "💰", legs: 1, category: "simple" },
  
  // Vertical Spreads
  BULL_CALL_SPREAD: { name: "Bull Call Spread", emoji: "🐂", legs: 2, category: "vertical" },
  BEAR_CALL_SPREAD: { name: "Bear Call Spread", emoji: "🐻", legs: 2, category: "vertical" },
  BULL_PUT_SPREAD: { name: "Bull Put Spread", emoji: "🐂", legs: 2, category: "vertical" },
  BEAR_PUT_SPREAD: { name: "Bear Put Spread", emoji: "🐻", legs: 2, category: "vertical" },
  
  // Multi-Leg Strategies
  IRON_CONDOR: { name: "Iron Condor", emoji: "🦅", legs: 4, category: "advanced" },
  IRON_BUTTERFLY: { name: "Iron Butterfly", emoji: "🦋", legs: 4, category: "advanced" },
  LONG_STRADDLE: { name: "Long Straddle", emoji: "💥", legs: 2, category: "advanced" },
  LONG_STRANGLE: { name: "Long Strangle", emoji: "⚡", legs: 2, category: "advanced" },
  CALENDAR_SPREAD: { name: "Calendar Spread", emoji: "📅", legs: 2, category: "advanced" },
  DIAGONAL_SPREAD: { name: "Diagonal Spread", emoji: "📐", legs: 2, category: "advanced" },
  BUTTERFLY_SPREAD: { name: "Butterfly Spread", emoji: "🦋", legs: 3, category: "advanced" },
  COVERED_CALL: { name: "Covered Call", emoji: "☂️", legs: 2, category: "advanced" },
  PROTECTIVE_PUT: { name: "Protective Put", emoji: "🛡️", legs: 2, category: "advanced" },
} as const;

export type StrategyType = keyof typeof STRATEGIES;

export const strategyTypes = Object.keys(STRATEGIES) as StrategyType[];

// Trade leg for multi-leg strategies
export const tradeLegSchema = z.object({
  type: z.enum(["CALL", "PUT", "STOCK"]),
  action: z.enum(["BUY", "SELL"]),
  strike: z.coerce.number().optional().nullable(),
  expiration: z.string().optional(),
  quantity: z.coerce.number(),
  premium: z.coerce.number().optional().nullable(),
});

export type TradeLeg = z.infer<typeof tradeLegSchema>;

// Trade status
export type TradeStatus = "OPEN" | "CLOSED" | "PARTIAL";

// Main trade schema
export const insertTradeSchema = z.object({
  ticker: z.string().min(1).max(10),
  strategy: z.enum(strategyTypes as [StrategyType, ...StrategyType[]]),
  status: z.enum(["OPEN", "CLOSED", "PARTIAL"]).default("OPEN"),
  legs: z.array(tradeLegSchema).min(1),
  entryPrice: z.coerce.number(),
  exitPrice: z.coerce.number().optional().nullable(),
  quantity: z.coerce.number().min(1),
  entryDate: z.string(),
  exitDate: z.string().optional(),
  notes: z.string().optional(),
  maxProfit: z.coerce.number().optional().nullable(),
  maxLoss: z.coerce.number().optional().nullable(),
  userId: z.string(),
  shared: z.boolean().default(false),
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;

export interface Trade extends InsertTrade {
  id: string;
  createdAt: string;
  pnl: number | null;
  pnlPercent: number | null;
  likes: string[];
  commentCount: number;
  // Expiration tracking for closed trades
  expirationStockPrice: number | null;  // Stock price at option expiration
  theoreticalExitValue: number | null;  // What the option was worth at expiration
  missedPnl: number | null;             // Difference: theoretical value - actual exit
  // Edit tracking
  editedAt: string | null;              // Timestamp of last edit
}

// Comment schema
export const insertCommentSchema = z.object({
  tradeId: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(500),
});

export type InsertComment = z.infer<typeof insertCommentSchema>;

export interface Comment extends InsertComment {
  id: string;
  createdAt: string;
}

// User schema (simplified for MVP)
export const insertUserSchema = z.object({
  username: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface User extends InsertUser {
  id: string;
}

// Stats for dashboard
export interface UserStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  openTrades: number;
  closedTrades: number;
}

// Feed filters
export type FeedFilter = "all" | "open" | "closed" | "winners" | "losers";

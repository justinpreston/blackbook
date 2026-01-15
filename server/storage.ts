import {
  type User,
  type InsertUser,
  type Trade,
  type InsertTrade,
  type Comment,
  type InsertComment,
  type UserStats,
  type FeedFilter,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Trades
  getTrade(id: string): Promise<Trade | undefined>;
  getTrades(filter?: FeedFilter): Promise<Trade[]>;
  getSharedTrades(filter?: FeedFilter): Promise<Trade[]>;
  getUserTrades(userId: string, filter?: FeedFilter): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: string, data: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: string): Promise<boolean>;
  toggleShare(tradeId: string): Promise<boolean>;
  getExpiredTrades(): Promise<Trade[]>;
  updateExpirationData(tradeId: string, stockPrice: number, theoreticalValue: number): Promise<Trade | undefined>;

  // Likes
  toggleLike(tradeId: string, userId: string): Promise<boolean>;

  // Comments
  getComments(tradeId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Stats
  getUserStats(userId?: string): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trades: Map<string, Trade>;
  private comments: Map<string, Comment>;

  constructor() {
    this.users = new Map();
    this.trades = new Map();
    this.comments = new Map();

    // Create some demo users
    this.seedData();
  }

  private seedData() {
    const demoUsers: User[] = [
      { id: "user1", username: "alex_trader", displayName: "Alex Chen", avatarUrl: undefined },
      { id: "user2", username: "maria_options", displayName: "Maria Rodriguez", avatarUrl: undefined },
      { id: "user3", username: "john_spread", displayName: "John Smith", avatarUrl: undefined },
      { id: "guest", username: "guest", displayName: "Guest Trader", avatarUrl: undefined },
    ];

    demoUsers.forEach((u) => this.users.set(u.id, u));

    // Demo trades for initial feed
    const demoTrades: Trade[] = [
      {
        id: "trade1",
        ticker: "AAPL",
        strategy: "BULL_CALL_SPREAD",
        status: "CLOSED",
        legs: [
          { type: "CALL", action: "BUY", strike: 180, expiration: "2025-02-21", quantity: 1, premium: 5.20 },
          { type: "CALL", action: "SELL", strike: 190, expiration: "2025-02-21", quantity: 1, premium: 2.30 },
        ],
        entryPrice: 2.90,
        exitPrice: 6.50,
        quantity: 5,
        entryDate: "2025-01-10",
        exitDate: "2025-01-14",
        notes: "Played the earnings run-up. Closed early to lock in profits.",
        maxProfit: 500,
        maxLoss: 145,
        userId: "user1",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        pnl: 1800,
        pnlPercent: 124.1,
        likes: ["user2", "user3"],
        commentCount: 2,
        shared: true,
        expirationStockPrice: null,
        theoreticalExitValue: null,
        missedPnl: null,
      },
      {
        id: "trade2",
        ticker: "TSLA",
        strategy: "IRON_CONDOR",
        status: "OPEN",
        legs: [
          { type: "PUT", action: "SELL", strike: 200, expiration: "2025-02-07", quantity: 1, premium: 3.50 },
          { type: "PUT", action: "BUY", strike: 190, expiration: "2025-02-07", quantity: 1, premium: 1.80 },
          { type: "CALL", action: "SELL", strike: 250, expiration: "2025-02-07", quantity: 1, premium: 4.20 },
          { type: "CALL", action: "BUY", strike: 260, expiration: "2025-02-07", quantity: 1, premium: 2.10 },
        ],
        entryPrice: 3.80,
        exitPrice: undefined,
        quantity: 2,
        entryDate: "2025-01-13",
        exitDate: undefined,
        notes: "Expecting sideways action after the earnings move. Playing the IV crush.",
        maxProfit: 760,
        maxLoss: 1240,
        userId: "user2",
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        pnl: null,
        pnlPercent: null,
        likes: ["user1"],
        commentCount: 1,
        shared: true,
        expirationStockPrice: null,
        theoreticalExitValue: null,
        missedPnl: null,
      },
      {
        id: "trade3",
        ticker: "SPY",
        strategy: "LONG_PUT",
        status: "CLOSED",
        legs: [
          { type: "PUT", action: "BUY", strike: 470, expiration: "2025-01-31", quantity: 3, premium: 8.50 },
        ],
        entryPrice: 8.50,
        exitPrice: 2.10,
        quantity: 3,
        entryDate: "2025-01-08",
        exitDate: "2025-01-12",
        notes: "Hedging my long portfolio. Market didn't drop as expected.",
        maxProfit: undefined,
        maxLoss: undefined,
        userId: "user3",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        pnl: -1920,
        pnlPercent: -75.3,
        likes: [],
        commentCount: 0,
        shared: false,
        expirationStockPrice: 485,
        theoreticalExitValue: 0,
        missedPnl: 640,
      },
      {
        id: "trade4",
        ticker: "NVDA",
        strategy: "LONG_CALL",
        status: "OPEN",
        legs: [
          { type: "CALL", action: "BUY", strike: 550, expiration: "2025-03-21", quantity: 2, premium: 45.00 },
        ],
        entryPrice: 45.00,
        exitPrice: undefined,
        quantity: 2,
        entryDate: "2025-01-14",
        exitDate: undefined,
        notes: "AI hype continues. Betting on earnings beat.",
        maxProfit: undefined,
        maxLoss: undefined,
        userId: "user1",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        pnl: null,
        pnlPercent: null,
        likes: ["user2", "user3", "guest"],
        commentCount: 3,
        shared: true,
        expirationStockPrice: null,
        theoreticalExitValue: null,
        missedPnl: null,
      },
      {
        id: "trade5",
        ticker: "AMD",
        strategy: "COVERED_CALL",
        status: "OPEN",
        legs: [
          { type: "STOCK", action: "BUY", strike: null, expiration: undefined, quantity: 100, premium: undefined },
          { type: "CALL", action: "SELL", strike: 180, expiration: "2025-02-14", quantity: 1, premium: 3.25 },
        ],
        entryPrice: 175.00,
        exitPrice: undefined,
        quantity: 1,
        entryDate: "2025-01-12",
        exitDate: undefined,
        notes: "Selling premium on my AMD shares",
        maxProfit: undefined,
        maxLoss: undefined,
        userId: "guest",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        pnl: null,
        pnlPercent: null,
        likes: [],
        commentCount: 0,
        shared: false,
        expirationStockPrice: null,
        theoreticalExitValue: null,
        missedPnl: null,
      },
      {
        id: "trade6",
        ticker: "META",
        strategy: "LONG_CALL",
        status: "CLOSED",
        legs: [
          { type: "CALL", action: "BUY", strike: 500, expiration: "2025-01-31", quantity: 2, premium: 12.50 },
        ],
        entryPrice: 12.50,
        exitPrice: 22.00,
        quantity: 2,
        entryDate: "2025-01-05",
        exitDate: "2025-01-11",
        notes: "Quick earnings play, nailed it!",
        maxProfit: undefined,
        maxLoss: undefined,
        userId: "guest",
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        pnl: 1900,
        pnlPercent: 76.0,
        likes: ["user1", "user2"],
        commentCount: 1,
        shared: true,
        expirationStockPrice: 520,
        theoreticalExitValue: 40,
        missedPnl: 3600,
      },
    ];

    demoTrades.forEach((t) => this.trades.set(t.id, t));

    // Demo comments
    const demoComments: Comment[] = [
      { id: "c1", tradeId: "trade1", userId: "user2", content: "Nice trade! What made you exit early?", createdAt: new Date(Date.now() - 80000000).toISOString() },
      { id: "c2", tradeId: "trade1", userId: "user1", content: "Thanks! Saw some resistance at 188 and didn't want to risk theta decay.", createdAt: new Date(Date.now() - 79000000).toISOString() },
      { id: "c3", tradeId: "trade2", userId: "user3", content: "Bold move with this IV. Keep us posted!", createdAt: new Date(Date.now() - 40000000).toISOString() },
      { id: "c4", tradeId: "trade4", userId: "user2", content: "NVDA has been on fire! Good timing.", createdAt: new Date(Date.now() - 3000000).toISOString() },
      { id: "c5", tradeId: "trade4", userId: "user3", content: "These premiums are insane though", createdAt: new Date(Date.now() - 2500000).toISOString() },
      { id: "c6", tradeId: "trade4", userId: "user1", content: "Yeah, but NVDA always surprises. Worth the premium.", createdAt: new Date(Date.now() - 2000000).toISOString() },
    ];

    demoComments.forEach((c) => this.comments.set(c.id, c));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Trades
  async getTrade(id: string): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  private applyFilter(trades: Trade[], filter?: FeedFilter): Trade[] {
    if (filter && filter !== "all") {
      switch (filter) {
        case "open":
          trades = trades.filter((t) => t.status === "OPEN");
          break;
        case "closed":
          trades = trades.filter((t) => t.status === "CLOSED");
          break;
        case "winners":
          trades = trades.filter((t) => t.pnl !== null && t.pnl > 0);
          break;
        case "losers":
          trades = trades.filter((t) => t.pnl !== null && t.pnl < 0);
          break;
      }
    }
    // Sort by createdAt descending
    return trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTrades(filter?: FeedFilter): Promise<Trade[]> {
    let trades = Array.from(this.trades.values());
    return this.applyFilter(trades, filter);
  }

  async getSharedTrades(filter?: FeedFilter): Promise<Trade[]> {
    let trades = Array.from(this.trades.values()).filter((t) => t.shared === true);
    return this.applyFilter(trades, filter);
  }

  async getUserTrades(userId: string, filter?: FeedFilter): Promise<Trade[]> {
    let trades = Array.from(this.trades.values()).filter((t) => t.userId === userId);
    return this.applyFilter(trades, filter);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const now = new Date().toISOString();

    let pnl: number | null = null;
    let pnlPercent: number | null = null;

    if (insertTrade.exitPrice !== undefined && insertTrade.exitPrice !== null && insertTrade.status === "CLOSED") {
      const cost = insertTrade.entryPrice * insertTrade.quantity * 100;
      const proceeds = insertTrade.exitPrice * insertTrade.quantity * 100;
      pnl = proceeds - cost;
      pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
    }

    const trade: Trade = {
      ...insertTrade,
      id,
      createdAt: now,
      pnl,
      pnlPercent,
      likes: [],
      commentCount: 0,
      expirationStockPrice: null,
      theoreticalExitValue: null,
      missedPnl: null,
    };

    this.trades.set(id, trade);
    return trade;
  }

  async updateTrade(id: string, data: Partial<Trade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;

    const updated = { ...trade, ...data };
    this.trades.set(id, updated);
    return updated;
  }

  async deleteTrade(id: string): Promise<boolean> {
    return this.trades.delete(id);
  }

  async toggleShare(tradeId: string): Promise<boolean> {
    const trade = this.trades.get(tradeId);
    if (!trade) return false;
    trade.shared = !trade.shared;
    this.trades.set(tradeId, trade);
    return trade.shared;
  }

  async getExpiredTrades(): Promise<Trade[]> {
    const today = new Date().toISOString().split("T")[0];
    return Array.from(this.trades.values()).filter((t) => {
      // Find trades that are closed and have options with expiration dates that have passed
      if (t.status !== "CLOSED" || t.expirationStockPrice !== null) return false;
      const hasExpiredOption = t.legs.some((leg) => {
        if (leg.type === "STOCK" || !leg.expiration) return false;
        return leg.expiration <= today;
      });
      return hasExpiredOption;
    });
  }

  async updateExpirationData(tradeId: string, stockPrice: number, theoreticalValue: number): Promise<Trade | undefined> {
    const trade = this.trades.get(tradeId);
    if (!trade) return undefined;

    // Calculate missed P&L
    const exitPrice = trade.exitPrice || 0;
    const missedPnl = (theoreticalValue - exitPrice) * trade.quantity * 100;

    const updated: Trade = {
      ...trade,
      expirationStockPrice: stockPrice,
      theoreticalExitValue: theoreticalValue,
      missedPnl,
    };

    this.trades.set(tradeId, updated);
    return updated;
  }

  // Likes
  async toggleLike(tradeId: string, userId: string): Promise<boolean> {
    const trade = this.trades.get(tradeId);
    if (!trade) return false;

    const index = trade.likes.indexOf(userId);
    if (index === -1) {
      trade.likes.push(userId);
    } else {
      trade.likes.splice(index, 1);
    }

    this.trades.set(tradeId, trade);
    return index === -1; // returns true if liked, false if unliked
  }

  // Comments
  async getComments(tradeId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.tradeId === tradeId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now,
    };

    this.comments.set(id, comment);

    // Update comment count on trade
    const trade = this.trades.get(insertComment.tradeId);
    if (trade) {
      trade.commentCount += 1;
      this.trades.set(trade.id, trade);
    }

    return comment;
  }

  // Stats
  async getUserStats(userId?: string): Promise<UserStats> {
    let trades = Array.from(this.trades.values());
    if (userId) {
      trades = trades.filter((t) => t.userId === userId);
    }

    const closedTrades = trades.filter((t) => t.status === "CLOSED");
    const winners = closedTrades.filter((t) => t.pnl !== null && t.pnl > 0);
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    let bestTrade: Trade | null = null;
    let worstTrade: Trade | null = null;

    for (const trade of closedTrades) {
      if (trade.pnl !== null) {
        if (!bestTrade || trade.pnl > (bestTrade.pnl || 0)) {
          bestTrade = trade;
        }
        if (!worstTrade || trade.pnl < (worstTrade.pnl || 0)) {
          worstTrade = trade;
        }
      }
    }

    return {
      totalTrades: trades.length,
      winRate: closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0,
      totalPnl,
      bestTrade,
      worstTrade,
      openTrades: trades.filter((t) => t.status === "OPEN").length,
      closedTrades: closedTrades.length,
    };
  }
}

export const storage = new MemStorage();

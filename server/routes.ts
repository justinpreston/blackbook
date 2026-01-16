import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertCommentSchema, type FeedFilter } from "@shared/schema";
import { getStockQuote, getMultipleQuotes } from "./alpha-vantage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get current user (for demo, returns guest user)
  app.get("/api/users/me", async (req, res) => {
    const user = await storage.getUser("guest");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Get user stats
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getUserStats();
    res.json(stats);
  });

  // Get all shared trades (for home feed)
  app.get("/api/trades/shared", async (req, res) => {
    const filter = (req.query.filter as FeedFilter) || "all";
    const trades = await storage.getSharedTrades(filter);
    res.json(trades);
  });

  // Get current user's trades (for My Trades tab)
  app.get("/api/trades/mine", async (req, res) => {
    const filter = (req.query.filter as FeedFilter) || "all";
    const trades = await storage.getUserTrades("guest", filter);
    res.json(trades);
  });

  // Get trades with optional filter (legacy)
  app.get("/api/trades", async (req, res) => {
    const filter = (req.query.filter as FeedFilter) || "all";
    const trades = await storage.getTrades(filter);
    res.json(trades);
  });

  // Get single trade
  app.get("/api/trades/:id", async (req, res) => {
    const trade = await storage.getTrade(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }
    res.json(trade);
  });

  // Create new trade
  app.post("/api/trades", async (req, res) => {
    try {
      const data = insertTradeSchema.parse({
        ...req.body,
        userId: "guest", // For demo, use guest user
      });
      
      // Normalize exitDate - treat empty string as null
      const normalizedExitDate = data.exitDate && data.exitDate.trim() !== "" ? data.exitDate : null;
      
      // Require exit date for closed options trades (not stocks)
      if (data.status === "CLOSED" && data.strategy !== "STOCK" && !normalizedExitDate) {
        return res.status(400).json({ error: "Exit date is required for closed options trades" });
      }
      
      const trade = await storage.createTrade({ ...data, exitDate: normalizedExitDate });
      res.status(201).json(trade);
    } catch (error: any) {
      console.error("Trade creation error:", error);
      res.status(400).json({ error: error.message || "Invalid trade data" });
    }
  });

  // Update existing trade
  app.put("/api/trades/:id", async (req, res) => {
    try {
      const tradeId = req.params.id;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }
      
      // Only allow owner to edit
      if (trade.userId !== "guest") {
        return res.status(403).json({ error: "Not authorized to edit this trade" });
      }
      
      const data = insertTradeSchema.omit({ userId: true }).parse(req.body);
      
      // Normalize exitDate - treat empty string as null
      const normalizedExitDate = data.exitDate && data.exitDate.trim() !== "" ? data.exitDate : null;
      
      // Require exit date for closed options trades (not stocks)
      if (data.status === "CLOSED" && data.strategy !== "STOCK" && !normalizedExitDate) {
        return res.status(400).json({ error: "Exit date is required for closed options trades" });
      }
      
      // Calculate P&L for closed trades
      let pnl: number | null = null;
      let pnlPercent: number | null = null;
      
      if (data.exitPrice !== undefined && data.exitPrice !== null && data.status === "CLOSED") {
        const cost = data.entryPrice * data.quantity * 100;
        const proceeds = data.exitPrice * data.quantity * 100;
        pnl = proceeds - cost;
        pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;
      }
      
      const updatedTrade = await storage.updateTrade(tradeId, {
        ...data,
        exitDate: normalizedExitDate,
        pnl,
        pnlPercent,
        editedAt: new Date().toISOString(),
        // Reset expiration tracking when trade is edited
        expirationStockPrice: null,
        theoreticalExitValue: null,
        missedPnl: null,
      });
      
      res.json(updatedTrade);
    } catch (error: any) {
      console.error("Trade update error:", error);
      res.status(400).json({ error: error.message || "Invalid trade data" });
    }
  });

  // Toggle share on trade
  app.post("/api/trades/:id/share", async (req, res) => {
    const tradeId = req.params.id;
    const trade = await storage.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }
    // Only allow owner to toggle share
    if (trade.userId !== "guest") {
      return res.status(403).json({ error: "Not authorized" });
    }
    const shared = await storage.toggleShare(tradeId);
    res.json({ shared });
  });

  // Toggle like on trade
  app.post("/api/trades/:id/like", async (req, res) => {
    const tradeId = req.params.id;
    const userId = "guest"; // For demo
    
    const trade = await storage.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const liked = await storage.toggleLike(tradeId, userId);
    res.json({ liked });
  });

  // Get comments for a trade
  app.get("/api/trades/:id/comments", async (req, res) => {
    const tradeId = req.params.id;
    const trade = await storage.getTrade(tradeId);
    if (!trade) {
      return res.status(404).json({ error: "Trade not found" });
    }

    const comments = await storage.getComments(tradeId);
    res.json(comments);
  });

  // Create comment on trade
  app.post("/api/trades/:id/comments", async (req, res) => {
    try {
      const tradeId = req.params.id;
      const trade = await storage.getTrade(tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }

      const data = insertCommentSchema.parse({
        tradeId,
        userId: "guest", // For demo
        content: req.body.content,
      });

      const comment = await storage.createComment(data);
      res.status(201).json(comment);
    } catch (error: any) {
      console.error("Comment creation error:", error);
      res.status(400).json({ error: error.message || "Invalid comment data" });
    }
  });

  // Get current stock price
  app.get("/api/quotes/:symbol", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await getStockQuote(symbol);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found or rate limit exceeded" });
    }
    res.json(quote);
  });

  // Get prices for open trades
  app.get("/api/quotes/trades/open", async (req, res) => {
    try {
      const trades = await storage.getTrades("open");
      const symbols = trades.map(t => t.ticker);
      const quotes = await getMultipleQuotes(symbols);
      
      // Convert Map to object for JSON serialization
      const quotesObj: Record<string, any> = {};
      quotes.forEach((quote, symbol) => {
        quotesObj[symbol] = quote;
      });
      
      res.json(quotesObj);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ error: "Failed to fetch quotes" });
    }
  });

  // Calculate expiration value for a closed trade
  app.post("/api/trades/:id/calculate-expiration", async (req, res) => {
    try {
      const tradeId = req.params.id;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }
      
      if (trade.status !== "CLOSED") {
        return res.status(400).json({ error: "Trade must be closed to calculate expiration value" });
      }
      
      // Find the expiration date from the legs
      const optionLegs = trade.legs.filter(leg => leg.type !== "STOCK" && leg.expiration);
      if (optionLegs.length === 0) {
        return res.status(400).json({ error: "No option legs found with expiration dates" });
      }
      
      // Get current stock price (ideally we'd get historical price at expiration)
      const quote = await getStockQuote(trade.ticker);
      if (!quote) {
        return res.status(500).json({ error: "Failed to fetch stock price" });
      }
      
      // Calculate theoretical value at expiration for each leg
      let theoreticalValue = 0;
      for (const leg of optionLegs) {
        if (!leg.strike) continue;
        
        const intrinsicValue = leg.type === "CALL" 
          ? Math.max(0, quote.price - leg.strike)
          : Math.max(0, leg.strike - quote.price);
        
        const legValue = leg.action === "BUY" ? intrinsicValue : -intrinsicValue;
        theoreticalValue += legValue * (leg.quantity || 1);
      }
      
      // Normalize by total quantity of first leg
      theoreticalValue = theoreticalValue / (optionLegs[0].quantity || 1);
      
      // Update the trade with expiration data
      const updatedTrade = await storage.updateExpirationData(tradeId, quote.price, theoreticalValue);
      
      res.json(updatedTrade);
    } catch (error: any) {
      console.error("Error calculating expiration:", error);
      res.status(500).json({ error: "Failed to calculate expiration value" });
    }
  });

  // Get trades needing expiration calculation
  app.get("/api/trades/expired", async (req, res) => {
    const trades = await storage.getExpiredTrades();
    res.json(trades);
  });

  // Get user's open positions (for roll/adjustment dropdown)
  app.get("/api/positions/open", async (req, res) => {
    const positions = await storage.getUserOpenPositions("guest");
    res.json(positions);
  });

  // Get all trades in a position chain
  app.get("/api/positions/:positionId/trades", async (req, res) => {
    const trades = await storage.getPositionTrades(req.params.positionId);
    res.json(trades);
  });

  // Create a roll trade (closes parent and opens new)
  app.post("/api/trades/:id/roll", async (req, res) => {
    try {
      const parentTradeId = req.params.id;
      const parentTrade = await storage.getTrade(parentTradeId);
      
      if (!parentTrade) {
        return res.status(404).json({ error: "Parent trade not found" });
      }
      
      if (parentTrade.userId !== "guest") {
        return res.status(403).json({ error: "Not authorized to roll this trade" });
      }
      
      if (parentTrade.status !== "OPEN") {
        return res.status(400).json({ error: "Can only roll open trades" });
      }

      // Validate required roll fields
      if (req.body.parentExitPrice === undefined || req.body.parentExitPrice === "") {
        return res.status(400).json({ error: "Parent exit price is required for rolling" });
      }

      const parentExitPrice = parseFloat(req.body.parentExitPrice);
      const parentExitDate = req.body.parentExitDate || new Date().toISOString().split('T')[0];

      // Ensure positionId exists - create one if parent doesn't have it
      const positionId = parentTrade.positionId || `pos-${parentTrade.ticker.toLowerCase()}-${Date.now()}`;

      // Calculate P&L for the closing parent trade using provided exit price
      const cost = parentTrade.entryPrice * parentTrade.quantity * 100;
      const proceeds = parentExitPrice * parentTrade.quantity * 100;
      const pnl = proceeds - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      // Close the parent trade first with the correct P&L
      await storage.updateTrade(parentTradeId, {
        status: "CLOSED",
        exitPrice: parentExitPrice,
        exitDate: parentExitDate,
        pnl,
        pnlPercent,
        positionId, // Ensure parent has positionId if it was missing
        expirationStockPrice: null,
        theoreticalExitValue: null,
        missedPnl: null,
      });

      // Create the new rolled trade, inheriting shared status from parent
      const data = insertTradeSchema.parse({
        ...req.body,
        userId: "guest",
        adjustmentType: "ROLL",
        positionId: positionId,
        parentTradeId: parentTradeId,
        shared: parentTrade.shared, // Inherit shared status
      });
      
      // Normalize exitDate for new trade
      const normalizedExitDate = data.exitDate && data.exitDate.trim() !== "" ? data.exitDate : null;
      
      // Create the new rolled trade
      const newTrade = await storage.createTrade({ ...data, exitDate: normalizedExitDate });
      
      res.status(201).json(newTrade);
    } catch (error: any) {
      console.error("Roll trade error:", error);
      res.status(400).json({ error: error.message || "Invalid roll data" });
    }
  });

  return httpServer;
}
